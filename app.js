    document.getElementById('year').textContent = new Date().getFullYear();

    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Cursor-follow spotlight on cards / compare-cards / steps
    (function(){
      if (prefersReducedMotion) return;
      var hosts = document.querySelectorAll('.card, .compare-card, .step');
      hosts.forEach(function(el){
        el.addEventListener('mousemove', function(e){
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    })();

    // Ambient parallax on background orbs (mouse-driven, independent of their own float animation)
    (function(){
      if (prefersReducedMotion) return;
      var orbs = document.querySelectorAll('.orb-parallax[data-parallax]');
      if (!orbs.length) return;
      var mx = 0, my = 0, raf = null;
      function update(){
        raf = null;
        orbs.forEach(function(el){
          var factor = parseFloat(el.getAttribute('data-parallax')) || 10;
          el.style.transform = 'translate3d(' + (mx * factor).toFixed(1) + 'px,' + (my * factor).toFixed(1) + 'px,0)';
        });
      }
      window.addEventListener('mousemove', function(e){
        mx = (e.clientX / window.innerWidth) - 0.5;
        my = (e.clientY / window.innerHeight) - 0.5;
        if (!raf) raf = requestAnimationFrame(update);
      }, { passive:true });
    })();

    /* ---------- Legal modals (mentions légales / confidentialité) ---------- */
    (function(){
      var openers = document.querySelectorAll('[data-open-legal]');
      var overlays = document.querySelectorAll('[data-legal-overlay]');
      var activeOverlay = null;
      var lastFocused = null;

      function closeLegal(){
        if(!activeOverlay) return;
        activeOverlay.classList.remove('is-open');
        activeOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        activeOverlay = null;
        if(lastFocused && lastFocused.focus) lastFocused.focus();
      }

      function openLegal(id){
        var overlay = document.getElementById('legal-' + id);
        if(!overlay) return;
        lastFocused = document.activeElement;
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        activeOverlay = overlay;
        var closeBtn = overlay.querySelector('[data-close-legal]');
        if(closeBtn) closeBtn.focus();
      }

      openers.forEach(function(btn){
        btn.addEventListener('click', function(){ openLegal(btn.getAttribute('data-open-legal')); });
      });

      overlays.forEach(function(overlay){
        overlay.addEventListener('click', function(e){
          if(e.target === overlay) closeLegal();
        });
        overlay.querySelectorAll('[data-close-legal]').forEach(function(btn){
          btn.addEventListener('click', closeLegal);
        });
      });

      function getFocusable(container){
        return Array.prototype.slice.call(container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ));
      }

      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' && activeOverlay){ closeLegal(); return; }
        if(e.key === 'Tab' && activeOverlay){
          var focusable = getFocusable(activeOverlay);
          if(!focusable.length) return;
          var first = focusable[0];
          var last = focusable[focusable.length - 1];
          if(e.shiftKey && document.activeElement === first){
            e.preventDefault();
            last.focus();
          } else if(!e.shiftKey && document.activeElement === last){
            e.preventDefault();
            first.focus();
          }
        }
      });
    })();

    // Sticky nav shrink + scroll progress bar
    (function(){
      var nav = document.getElementById('topnav');
      var progress = document.getElementById('scrollProgress');
      function onScroll(){
        if (window.scrollY > 12) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
        if (progress) {
          var doc = document.documentElement;
          var max = doc.scrollHeight - doc.clientHeight;
          var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
          progress.style.transform = 'scaleX(' + ratio + ')';
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      onScroll();
    })();


    // Mobile nav toggle
    (function(){
      var nav = document.getElementById('topnav');
      var toggle = document.getElementById('navtoggle');
      var links = document.getElementById('navlinks');
      if (!toggle || !links) return;
      function isMobile(){
        return window.matchMedia('(max-width: 860px)').matches;
      }
      function syncInert(){
        var open = nav.classList.contains('nav-open');
        if (isMobile() && !open) {
          links.setAttribute('inert', '');
        } else {
          links.removeAttribute('inert');
        }
      }
      function close(){
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Ouvrir le menu');
        syncInert();
      }
      toggle.addEventListener('click', function(){
        var open = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        syncInert();
      });
      links.addEventListener('click', function(e){
        if (e.target.tagName === 'A') close();
      });
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) close();
      });
      window.addEventListener('resize', syncInert);
      syncInert();
    })();

    // Scroll reveal
    var revealItems = document.querySelectorAll('.reveal, .tl-item');
    (function(){
      if(!('IntersectionObserver' in window) || !revealItems.length){
        revealItems.forEach(function(el){ el.classList.add('is-visible'); });
        return;
      }
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealItems.forEach(function(el){ io.observe(el); });
    })();

    // Animated stat counters
    (function(){
      var stats = document.querySelectorAll('.stat-num:not(.stat-static)');
      if (!stats.length) return;
      function formatCount(value, thousands){
        if (!thousands) return String(value);
        var sign = value < 0 ? '-' : '';
        var digits = String(Math.abs(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
        return sign + digits;
      }
      function animate(el){
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var thousands = el.hasAttribute('data-thousands');
        var start = null;
        var duration = 1200;
        function step(ts){
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var value = Math.round(eased * target);
          el.textContent = formatCount(value, thousands) + (progress >= 1 ? suffix : '');
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }
      if (!('IntersectionObserver' in window)) {
        stats.forEach(function(el){ el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
        return;
      }
      var io2 = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            animate(entry.target);
            io2.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      stats.forEach(function(el){ io2.observe(el); });
    })();

    // Contact form -> opens a pre-filled mailto (no server-side storage on GitHub Pages)
    (function(){
      var form = document.getElementById('contact-form');
      var btn = document.getElementById('submit-btn');
      var status = document.getElementById('form-status');

      function mailtoLink(data){
        var subject = encodeURIComponent('Contact site — ' + data.name);
        var body = encodeURIComponent(
          'Nom: ' + data.name + '\n' +
          'Entreprise: ' + (data.company || '—') + '\n' +
          'E-mail: ' + data.email + '\n' +
          'Téléphone: ' + (data.phone || '—') + '\n\n' +
          data.message
        );
        return 'mailto:loic@jault-conseil.fr?subject=' + subject + '&body=' + body;
      }

      function handleSubmit(e){
        e.preventDefault();
        if (!form.reportValidity()) return;

        var data = {
          name: document.getElementById('f-name').value.trim(),
          company: document.getElementById('f-company').value.trim(),
          email: document.getElementById('f-email').value.trim(),
          phone: document.getElementById('f-phone').value.trim(),
          message: document.getElementById('f-message').value.trim()
        };

        status.textContent = 'Ouverture de votre messagerie…';
        window.location.href = mailtoLink(data);
      }

      btn.addEventListener('click', handleSubmit);
      form.addEventListener('submit', handleSubmit);
    })();
