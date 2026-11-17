if ('IntersectionObserver' in window && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
}
