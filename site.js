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

const enquiryForm = document.querySelector('.enquiry-form');

if (enquiryForm) {
  const endpoint = enquiryForm.dataset.endpoint;
  const submitButton = enquiryForm.querySelector('button[type="submit"]');
  const status = enquiryForm.querySelector('[role="status"]');
  let lastDraft;
  let submissionId;

  if (endpoint) {
    submitButton.disabled = false;
  } else {
    status.textContent = 'Please email admin@berkshire.nz to send your enquiry.';
  }

  enquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    const fields = Object.fromEntries(new FormData(enquiryForm));
    const draft = JSON.stringify(fields);
    if (draft !== lastDraft) {
      submissionId = crypto.randomUUID();
      lastDraft = draft;
    }

    submitButton.disabled = true;
    enquiryForm.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, submissionId }),
        signal: AbortSignal.timeout(12000),
      });
      if (response.status === 400) {
        status.textContent = 'Please check your contact details and message, then try again.';
        return;
      }
      if (response.status === 429) {
        status.textContent = 'Please try again later or email admin@berkshire.nz.';
        return;
      }
      if (!response.ok || (await response.json()).received !== true) throw new Error('Enquiry not confirmed');

      if (JSON.stringify(Object.fromEntries(new FormData(enquiryForm))) === draft) enquiryForm.reset();
      lastDraft = undefined;
      status.textContent = 'Thanks for your enquiry. We’ll be in touch soon.';
    } catch {
      status.textContent = 'We couldn’t confirm your enquiry. Please try again or email admin@berkshire.nz.';
    } finally {
      enquiryForm.removeAttribute('aria-busy');
      submitButton.disabled = false;
    }
  });
}
