(function () {
  'use strict';

  var trigger = document.getElementById('nav-search-btn');
  var searchWrap = document.getElementById('search-form-wrap');
  var form = document.getElementById('local-search-form');
  var input = document.getElementById('search-input');
  var clearButton = document.getElementById('search-clear');
  var resultsContainer = document.getElementById('search-results');

  if (!trigger || !searchWrap || !form || !input || !resultsContainer) {
    return;
  }

  var searchPath = form.getAttribute('data-search-path') || '/search.xml';
  var searchData = [];
  var currentResults = [];
  var loadState = 'idle';

  function normalize(value) {
    return (value || '').trim().toLocaleLowerCase();
  }

  function htmlToText(value) {
    var container = document.createElement('div');
    container.innerHTML = value || '';

    // Search indexes contain the rendered post HTML. MathJax injects a large
    // <style> block beside every formula, whose CSS text would otherwise be
    // treated as article content. Keep real code blocks, but discard page
    // implementation details and the non-text SVG rendering layer.
    container.querySelectorAll('style, script, noscript, template, svg').forEach(function (node) {
      node.remove();
    });

    return (container.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function setOpen(isOpen) {
    searchWrap.classList.toggle('on', isOpen);
    searchWrap.setAttribute('aria-hidden', String(!isOpen));
    trigger.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      loadSearchData();
      window.setTimeout(function () { input.focus(); }, 50);
    }
  }

  function setMessage(message, state) {
    resultsContainer.replaceChildren();
    resultsContainer.hidden = false;
    resultsContainer.className = 'search-results search-results-' + state;

    var text = document.createElement('p');
    text.className = 'search-message';
    text.textContent = message;
    resultsContainer.appendChild(text);
  }

  function loadSearchData() {
    if (loadState !== 'idle') {
      return;
    }

    loadState = 'loading';
    setMessage('正在加载搜索索引…', 'loading');

    fetch(searchPath)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(function (xmlText) {
        var xml = new DOMParser().parseFromString(xmlText, 'text/xml');
        if (xml.querySelector('parsererror')) {
          throw new Error('Invalid XML');
        }

        searchData = Array.prototype.map.call(xml.querySelectorAll('entry'), function (entry) {
          var titleNode = entry.querySelector('title');
          var contentNode = entry.querySelector('content');
          var urlNode = entry.querySelector('url');
          var title = titleNode ? titleNode.textContent.trim() : '';
          var content = htmlToText(contentNode ? contentNode.textContent : '');

          return {
            title: title,
            normalizedTitle: normalize(title),
            content: content,
            normalizedContent: normalize(content),
            url: urlNode ? urlNode.textContent.trim() : '#'
          };
        });
        loadState = 'loaded';

        if (input.value.trim()) {
          performSearch(input.value);
        } else {
          resultsContainer.hidden = true;
        }
      })
      .catch(function () {
        loadState = 'failed';
        setMessage('搜索索引加载失败，请刷新页面后重试。', 'error');
      });
  }

  function createHighlightedText(text, query) {
    var fragment = document.createDocumentFragment();
    var normalizedText = normalize(text);
    var normalizedQuery = normalize(query);
    var cursor = 0;
    var matchIndex;

    while (normalizedQuery && (matchIndex = normalizedText.indexOf(normalizedQuery, cursor)) !== -1) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, matchIndex)));
      var mark = document.createElement('mark');
      mark.textContent = text.slice(matchIndex, matchIndex + query.length);
      fragment.appendChild(mark);
      cursor = matchIndex + query.length;
    }

    fragment.appendChild(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  function createSnippet(item, query) {
    var normalizedQuery = normalize(query);
    var titleMatched = item.normalizedTitle.includes(normalizedQuery);
    var queryIndex = titleMatched ? 0 : item.normalizedContent.indexOf(normalizedQuery);
    var start = Math.max(0, queryIndex === -1 ? 0 : queryIndex - 45);
    var end = Math.min(item.content.length, start + 155);
    var snippet = item.content.slice(start, end);

    return (start > 0 ? '…' : '') + snippet + (end < item.content.length ? '…' : '');
  }

  function renderResults(results, query) {
    resultsContainer.replaceChildren();
    resultsContainer.hidden = false;
    resultsContainer.className = 'search-results search-results-ready';

    if (!results.length) {
      setMessage('没有找到与“' + query + '”相关的文章。', 'empty');
      return;
    }

    var summary = document.createElement('p');
    summary.className = 'search-result-count';
    summary.textContent = '找到 ' + results.length + ' 篇相关文章';
    resultsContainer.appendChild(summary);

    var list = document.createElement('ul');
    list.className = 'search-result-list';

    results.forEach(function (item) {
      var listItem = document.createElement('li');
      listItem.className = 'search-result-item';

      var link = document.createElement('a');
      link.className = 'search-result-title';
      link.href = item.url;
      link.appendChild(createHighlightedText(item.title || '未命名文章', query));

      var preview = document.createElement('p');
      preview.className = 'search-result-preview';
      preview.appendChild(createHighlightedText(createSnippet(item, query), query));

      listItem.appendChild(link);
      listItem.appendChild(preview);
      list.appendChild(listItem);
    });

    resultsContainer.appendChild(list);
  }

  function performSearch(rawQuery) {
    var query = rawQuery.trim();
    var normalizedQuery = normalize(query);

    if (!query) {
      currentResults = [];
      resultsContainer.hidden = true;
      return;
    }

    if (loadState === 'idle') {
      loadSearchData();
      return;
    }
    if (loadState !== 'loaded') {
      return;
    }

    currentResults = searchData
      .filter(function (item) {
        return item.normalizedTitle.includes(normalizedQuery) ||
          item.normalizedContent.includes(normalizedQuery);
      })
      .sort(function (left, right) {
        var leftScore = left.normalizedTitle === normalizedQuery ? 3 :
          left.normalizedTitle.includes(normalizedQuery) ? 2 : 1;
        var rightScore = right.normalizedTitle === normalizedQuery ? 3 :
          right.normalizedTitle.includes(normalizedQuery) ? 2 : 1;
        return rightScore - leftScore;
      });

    renderResults(currentResults, query);
  }

  trigger.addEventListener('click', function () {
    setOpen(!searchWrap.classList.contains('on'));
  });

  input.addEventListener('input', function () {
    clearButton.classList.toggle('visible', Boolean(input.value));
    performSearch(input.value);
  });

  clearButton.addEventListener('click', function () {
    input.value = '';
    clearButton.classList.remove('visible');
    currentResults = [];
    resultsContainer.hidden = true;
    input.focus();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (currentResults.length) {
      window.location.href = currentResults[0].url;
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && searchWrap.classList.contains('on')) {
      setOpen(false);
      trigger.focus();
    }
  });

  document.addEventListener('click', function (event) {
    if (searchWrap.classList.contains('on') &&
        !searchWrap.contains(event.target) && !trigger.contains(event.target)) {
      setOpen(false);
    }
  });
})();
