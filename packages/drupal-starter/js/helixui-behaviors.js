/**
 * @file
 * HELiX UI Drupal behaviors.
 *
 * Provides Drupal behaviors for interactive SDCs using the once() pattern
 * for safe re-execution in Layout Builder and XB previews.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Carousel autoplay behavior.
   *
   * Initializes autoplay on views-carousel SDCs when the autoplay prop is set.
   */
  Drupal.behaviors.helixuiCarousel = {
    attach: function (context) {
      once('helixui-carousel', '.views-carousel[data-autoplay="true"]', context).forEach(
        function (element) {
          var carousel = element.querySelector('hx-carousel');
          var interval = parseInt(element.dataset.interval, 10) || 5000;
          if (carousel && typeof carousel.play === 'function') {
            carousel.play(interval);
          }
        },
      );
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once
          .remove('helixui-carousel', '.views-carousel[data-autoplay="true"]', context)
          .forEach(function (element) {
            var carousel = element.querySelector('hx-carousel');
            if (carousel && typeof carousel.pause === 'function') {
              carousel.pause();
            }
          });
      }
    },
  };

  /**
   * Mobile drawer toggle behavior.
   *
   * Manages open/close state of the mobile drawer SDC and body scroll locking.
   */
  Drupal.behaviors.helixuiMobileDrawer = {
    attach: function (context) {
      once('helixui-mobile-drawer', '.mobile-drawer', context).forEach(function (element) {
        var drawer = element.querySelector('hx-drawer');
        var trigger = element.querySelector('.mobile-drawer__trigger');
        var close = element.querySelector('.mobile-drawer__close');

        if (trigger && drawer) {
          trigger.addEventListener('click', function () {
            drawer.open = true;
            document.body.style.overflow = 'hidden';
          });
        }

        if (close && drawer) {
          close.addEventListener('click', function () {
            drawer.open = false;
            document.body.style.overflow = '';
          });
        }

        if (drawer) {
          drawer.addEventListener('hx-close', function () {
            document.body.style.overflow = '';
          });
        }
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('helixui-mobile-drawer', '.mobile-drawer', context).forEach(function () {
          document.body.style.overflow = '';
        });
      }
    },
  };

  /**
   * Search form enhancement behavior.
   *
   * Adds keyboard shortcut (/) to focus the search input.
   */
  Drupal.behaviors.helixuiSearchForm = {
    attach: function (context) {
      once('helixui-search-form', '.search-form', context).forEach(function (element) {
        var input = element.querySelector('hx-text-input');
        if (!input) {
          return;
        }

        document.addEventListener('keydown', function (event) {
          if (
            event.key === '/' &&
            !event.ctrlKey &&
            !event.metaKey &&
            document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA'
          ) {
            event.preventDefault();
            input.focus();
          }
        });
      });
    },
  };

  /**
   * Newsletter signup form validation behavior.
   *
   * Provides client-side email validation before form submission.
   */
  Drupal.behaviors.helixuiNewsletterSignup = {
    attach: function (context) {
      once('helixui-newsletter', '.newsletter-signup form', context).forEach(function (form) {
        form.addEventListener('submit', function (event) {
          var emailInput = form.querySelector('hx-text-input[type="email"]');
          if (emailInput && !emailInput.value) {
            event.preventDefault();
            emailInput.setAttribute('error', 'Please enter your email address.');
            emailInput.focus();
          }
        });
      });
    },
  };

  /**
   * Share buttons behavior.
   *
   * Opens share links in centered popup windows.
   */
  Drupal.behaviors.helixuiShareButtons = {
    attach: function (context) {
      once('helixui-share', '.share-buttons hx-button[data-share-url]', context).forEach(
        function (button) {
          button.addEventListener('click', function (event) {
            var shareUrl = button.dataset.shareUrl;
            if (shareUrl && !shareUrl.startsWith('mailto:')) {
              event.preventDefault();
              var width = 600;
              var height = 400;
              var left = (screen.width - width) / 2;
              var top = (screen.height - height) / 2;
              window.open(
                shareUrl,
                'share',
                'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top,
              );
            }
          });
        },
      );
    },
  };

  /**
   * Sidebar nav collapsible behavior.
   *
   * Enables expand/collapse of sidebar navigation groups.
   */
  Drupal.behaviors.helixuiSidebarNav = {
    attach: function (context) {
      once('helixui-sidebar-nav', '.sidebar-nav[data-collapsible="true"]', context).forEach(
        function (element) {
          var nav = element.querySelector('hx-side-nav');
          if (nav) {
            var groups = nav.querySelectorAll('[slot]');
            groups.forEach(function (group) {
              var heading = group.querySelector('hx-text');
              if (heading) {
                heading.style.cursor = 'pointer';
                heading.setAttribute('role', 'button');
                heading.setAttribute('aria-expanded', 'true');
                heading.addEventListener('click', function () {
                  var expanded = heading.getAttribute('aria-expanded') === 'true';
                  heading.setAttribute('aria-expanded', String(!expanded));
                  var list = group.querySelector('hx-nav');
                  if (list) {
                    list.hidden = expanded;
                  }
                });
              }
            });
          }
        },
      );
    },
  };
})(Drupal, once);
