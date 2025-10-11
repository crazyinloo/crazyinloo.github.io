// IIFE to avoid polluting the global scope
(function() {
    'use strict';

    // Helper function to fetch data (now fetches XML text)
    function fetchData(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(null, xhr.responseText); // Pass XML text
                } else {
                    callback(new Error('Search index file not found at ' + url), null);
                }
            }
        };
        xhr.onerror = function() { callback(new Error('Network error.'), null); };
        xhr.send();
    }

    // Main search function
    function initSearch(config) {
        var searchPath = window.SEARCH_PATH;
        if (!searchPath) {
            console.error("Search path is not defined.");
            return;
        }

        var searchInput = document.getElementById(config.searchInputId);
        var resultsContainer = document.getElementById(config.resultsContainerId);
        var searchTrigger = document.getElementById(config.searchTriggerId);
        var searchWrap = document.getElementById(config.searchWrapId);
        
        var searchData;
        var isDataLoaded = false;
        var currentResults = [];

        if (!searchInput || !resultsContainer || !searchTrigger || !searchWrap) {
            console.error("Search UI elements not found.");
            return;
        }

        searchTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            searchWrap.classList.toggle('on');
            if (searchWrap.classList.contains('on')) { searchInput.focus(); }
        });

        fetchData(searchPath, function(error, xmlText) {
            if (error) {
                console.error("Failed to load search data:", error.message);
                resultsContainer.innerHTML = '<p>搜索索引文件加载失败。</p>';
                return;
            }
            
            // =================================================================
            // === NEW XML PARSING LOGIC ===
            // =================================================================
            try {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xmlText, "text/xml");
                var entries = xmlDoc.querySelectorAll("entry");
                var data = [];
                entries.forEach(function(entry) {
                    data.push({
                        title: entry.querySelector("title").textContent,
                        content: entry.querySelector("content").textContent,
                        url: entry.querySelector("url").textContent
                    });
                });
                searchData = data;
                isDataLoaded = true;
                console.log("Search index loaded and parsed successfully.");
            } catch (e) {
                console.error("Failed to parse search.xml:", e);
                resultsContainer.innerHTML = '<p>搜索索引文件解析失败。</p>';
            }
        });
        
        searchInput.addEventListener('input', function() {
            var query = this.value.trim().toLowerCase();
            resultsContainer.innerHTML = '';
            currentResults = [];

            if (query.length === 0 || !isDataLoaded) return;

            var results = searchData.filter(function(item) {
                var title = item.title ? item.title.trim().toLowerCase() : '';
                var content = item.content ? item.content.trim().toLowerCase() : '';
                return title.includes(query) || content.includes(query);
            });

            currentResults = results;

            if (results.length > 0) {
              var resultHTML = '<ul class="search-result-list">'; // 为列表添加 class
              results.forEach(function(item) {
                  // 为每个列表项、链接和段落都添加 class
                  resultHTML += '<li class="search-result-item">';
                  resultHTML += '<a class="search-result-title" href="' + item.url + '">' + item.title + '</a>';
                  resultHTML += '<p class="search-result-preview">' + item.content.substring(0, 150).replace(/<[^>]+>/g, '') + '...</p>';
                  resultHTML += '</li>';
              });
              resultHTML += '</ul>';
              resultsContainer.innerHTML = resultHTML;
          }
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter' && e.keyCode !== 13) return;
            e.preventDefault();
            if (currentResults.length > 0) {
                // Ensure the URL is absolute or root-relative
                var targetUrl = new URL(currentResults[0].url, window.location.origin).href;
                window.location.href = targetUrl;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initSearch({
            searchTriggerId: 'nav-search-btn',
            searchWrapId: 'search-form-wrap',
            searchInputId: 'search-input',
            resultsContainerId: 'search-results'
        });
    });

})();