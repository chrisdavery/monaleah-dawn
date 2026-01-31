(function() {
  const params = new URLSearchParams(window.location.search);
  const tributeId = params.get('tribute');
  if (!tributeId) return;

  const observer = new MutationObserver(() => {
    const el = document.getElementById(tributeId);
    if (!el) return;

    // Calculate position relative to document
    const y = el.getBoundingClientRect().top + window.pageYOffset;
    
    // Scroll to exactly the element's top
    window.scrollTo({ top: y, behavior: 'smooth' });
    
    observer.disconnect();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();


document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.button--share-tribute').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const shareUrl = this.getAttribute('data-share-url');
      const title = this.getAttribute('data-title') || '';

      // Facebook sharer URL
      const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodeURIComponent(title)}`;

      // Open in NEW TAB instead of popup
      window.open(fbShareUrl, '_blank');
    });
  });
});