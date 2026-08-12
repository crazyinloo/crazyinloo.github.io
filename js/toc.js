(function ($) {
  'use strict';

  var $tocLinks = $('.toc-wrap .toc-link');
  var $header = $('#header-inner');
  var headerOffset = 80;
  var previousScrollY = $(window).scrollTop();
  var previousDirection;
  var ticking = false;

  if (!$tocLinks.length) {
    return;
  }

  var entries = $tocLinks.map(function () {
    var hash = $(this).attr('href');
    var id;

    if (!hash || hash.charAt(0) !== '#') {
      return null;
    }

    try {
      id = decodeURIComponent(hash.slice(1));
    } catch (error) {
      id = hash.slice(1);
    }

    var heading = document.getElementById(id);
    return heading ? { link: this, heading: heading } : null;
  }).get();

  function setActive(link) {
    $tocLinks.removeClass('toc-link-active').removeAttr('aria-current');
    if (link) {
      $(link).addClass('toc-link-active').attr('aria-current', 'location');
    }
  }

  function updateActiveHeading() {
    var marker = $(window).scrollTop() + headerOffset + 16;
    var active = entries[0];

    entries.forEach(function (entry) {
      if ($(entry.heading).offset().top <= marker) {
        active = entry;
      }
    });

    setActive(active && active.link);
  }

  function updateHeader(scrollY) {
    if (Math.abs(scrollY - previousScrollY) <= 5) {
      return;
    }

    var direction = scrollY > previousScrollY && scrollY > $header.height() ? 0 : 1;
    if (direction !== previousDirection) {
      $header.toggleClass('header-up', direction === 0);
      previousDirection = direction;
    }
    previousScrollY = scrollY;
  }

  $tocLinks.on('click', function (event) {
    var entry = entries.find(function (item) {
      return item.link === event.currentTarget;
    });

    if (!entry) {
      return;
    }

    event.preventDefault();
    setActive(entry.link);
    $header.addClass('header-up');
    entry.heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', $(entry.link).attr('href'));
  });

  $(window).on('scroll', function () {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(function () {
      var scrollY = $(window).scrollTop();
      updateHeader(scrollY);
      updateActiveHeading();
      ticking = false;
    });
  });

  $(window).on('hashchange popstate', updateActiveHeading);
  updateActiveHeading();
})(jQuery);
