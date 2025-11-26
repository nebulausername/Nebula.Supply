Nebula Web – QA Test Plan (Cart, Product Cards, Checkout)

Feature Flag
- Toggle new cart UI via localStorage:
  - Enable: localStorage.setItem('nebula_flags', JSON.stringify({ new_cart_ui: true }))
  - Disable: localStorage.setItem('nebula_flags', JSON.stringify({ new_cart_ui: false }))

Test Scenarios
- Product Card: image blur-up, badges, quick add, variant select, progressbar
- Filters & Sort: open panel, select, clear-all, sort persists
- Cart Modal: open/close, body-scroll lock, qty +/- remove, totals update
- Checkout: 1-col mobile, 2-col desktop, reduced payment methods
- Edge: empty cart, low stock, invite-required, reload preserves data

Accessibility
- Buttons labeled, focus visible, contrast AA

Performance
- Modal mounts when open, images lazy-load










































































