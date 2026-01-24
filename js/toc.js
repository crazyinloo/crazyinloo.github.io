(function ($) {
  // 配置
  const HEADER_HEIGHT = 80; 
  const BUFFER = 150; 
  const SHOW_TOP_BTN_HEIGHT = 300; // 滚动超过 300px 显示回到顶部按钮

  // ==========================================
  // 选择器
  // ==========================================
  const $tocLinks = $('.toc-link'); 
  const $header = $('#header-inner');
  const $headings = $('.article-entry').find('h1, h2, h3, h4, h5, h6');
  
  // 【新增】回到顶部按钮
  const $backToTopBtn = $('#back-to-top');

  let prevScrollY = $(window).scrollTop();
  let curScrollY;
  let prevDirection;
  let curDirection = 0;
  let delta = 5;
  let clickedByToc = false;

  // ... (省略 normalizeText, getHeadlineInterval 等辅助函数，保持不变) ...
  function normalizeText(text) { return text.replace(/[\d\.]+\s?/g, '').trim(); }
  function getHeadlineInterval() { /* ...同之前... */ 
      let offsets = $headings.map(function () { return $(this).offset().top; });
      let interval = Array.prototype.slice.call(offsets);
      interval.push(Math.max($(document).height(), $(window).height()));
      interval = interval.map(function (i) { return Math.floor(i); });
      return interval;
  }
  function toggleHeader(direction) { /* ...同之前... */ 
    if (direction === 0) $header.addClass('header-up');
    else if (direction === 1) $header.removeClass('header-up');
  }

  // ==========================================
  // 【新增】控制回到顶部按钮显隐
  // ==========================================
  function checkBackToTop(curScrollY) {
    if (curScrollY > SHOW_TOP_BTN_HEIGHT) {
      $backToTopBtn.addClass('show');
    } else {
      $backToTopBtn.removeClass('show');
    }
  }

  function checkScroll(curScrollY) { /* ...同之前... */
    if (Math.abs(curScrollY - prevScrollY) <= delta) return;
    if (curScrollY > prevScrollY && curScrollY > $header.height()) curDirection = 0;
    else if (curScrollY < prevScrollY) curDirection = 1;
    if (curDirection !== prevDirection) {
      toggleHeader(curDirection);
      prevDirection = curDirection;
    }
    prevScrollY = curScrollY;
  }

  function activeTocLink(curScrollY) { /* ...同之前... */
    if (clickedByToc) return;
    let headlineInterval = getHeadlineInterval();
    let readLine = curScrollY + HEADER_HEIGHT + BUFFER;
    $tocLinks.removeClass('active');
    for (let i = 0; i < headlineInterval.length - 1; i++) {
      let offsetA = headlineInterval[i];
      let offsetB = headlineInterval[i + 1];
      if (readLine >= offsetA && readLine < offsetB) {
        let $targetLink = $tocLinks.eq(i);
        $targetLink.addClass('active');
        $targetLink.parents('.toc-item').parents('.toc-child').prev('.toc-link').addClass('active');
        return;
      }
    }
  }

  // ==========================================
  // 事件监听
  // ==========================================
  
  // 1. 目录点击 (保持不变)
  $tocLinks.click(function (event) {
    event.preventDefault();
    clickedByToc = true;
    $tocLinks.removeClass('active');
    $(this).addClass('active');
    // ... (保持你刚才已经修复好的跳转逻辑) ...
    let $target;
    let href = $(this).attr('href'); 
    if (href) { try { let targetId = decodeURIComponent(href).substring(1); let targetElement = document.getElementById(targetId); if (targetElement) $target = $(targetElement); } catch (e) {} }
    if (!$target || !$target.length) {
        let rawLinkText = $(this).find('.toc-text').text() || $(this).text();
        let cleanLinkText = normalizeText(rawLinkText);
        $headings.each(function() {
            let cleanHeaderText = normalizeText($(this).text());
            if (cleanHeaderText === cleanLinkText || cleanHeaderText.includes(cleanLinkText) || cleanLinkText.includes(cleanHeaderText)) { $target = $(this); return false; }
        });
    }
    if (!$target || !$target.length) {
        let index = $tocLinks.index(this);
        if (index >= 0 && index < $headings.length) $target = $headings.eq(index);
    }

    if ($target && $target.length) {
      let targetTop = $target.offset().top - HEADER_HEIGHT - BUFFER;
      $('html, body').animate({ scrollTop: targetTop }, 300, function() { clickedByToc = false; });
    } else { clickedByToc = false; }
  });

  // 2. 【新增】回到顶部按钮点击
  $backToTopBtn.click(function() {
    $('html, body').animate({ scrollTop: 0 }, 400); // 400ms 平滑滚回去
  });

  // 3. 滚动监听
  $(window).scroll(function () {
    curScrollY = $(window).scrollTop();
    
    checkScroll(curScrollY);      // Header 显隐
    activeTocLink(curScrollY);    // 目录高亮
    checkBackToTop(curScrollY);   // 【新增】按钮显隐检查
  });

})(jQuery);