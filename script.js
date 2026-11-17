// Toggle the compact navigation on small screens and close it after a link is chosen.
const menuToggle = document.querySelector(".nav-toggle");
const navBar = document.querySelector(".nav-bar");

if (menuToggle && navBar) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navBar.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("menu-open", isOpen);
  });

  navBar.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navBar.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      document.body.classList.remove("menu-open");
    });
  });
}

// Show only menu cards matching the selected category; "all" restores every dish.
document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelectorAll(".food-card[data-category]").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

// Gallery lightbox state; keep the clicked thumbnail so keyboard focus can return to it.
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const closeButton = lightbox?.querySelector(".lightbox__close");
let lastFocusedImage = null;

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("menu-open");
  lastFocusedImage?.focus();
}

// Open the selected image and copy its descriptive alt text into the enlarged view.
document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) return;
    lastFocusedImage = item;
    lightboxImage.src = item.dataset.full || item.querySelector("img").src;
    lightboxImage.alt = item.querySelector("img").alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    closeButton?.focus();
  });
});

// Close the viewer from its button, the backdrop, or Escape.
closeButton?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
    if (navBar?.classList.contains("is-open")) menuToggle?.click();
  }
});

// Build a WhatsApp order request; the restaurant must confirm availability and details.
const orderForm = document.querySelector("#order-form");
orderForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!orderForm.reportValidity()) return;

  const data = new FormData(orderForm);
  const details = [
    "Hello Abel's Restaurant Demo, I'd like to place an order.",
    `Name: ${data.get("name")}`,
    `Phone: ${data.get("phone")}`,
    `Fulfilment: ${data.get("fulfilment")}`,
    `Order: ${data.get("order")}`,
    data.get("notes") ? `Address / notes: ${data.get("notes")}` : "",
  ].filter(Boolean).join("\n");
  const phoneNumber = "15551234567"; // Replace with the restaurant's WhatsApp number.
  const status = orderForm.querySelector(".form-status");
  if (status) status.textContent = "Opening WhatsApp with your order request. Your order is not confirmed until the restaurant replies.";
  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(details)}`, "_blank", "noopener,noreferrer");
});

// Reveal content as it enters the viewport, with a fallback for older browsers.
const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

// Add one shared, local FAQ assistant to every page that loads this script.
document.body.insertAdjacentHTML("beforeend", `
  <div class="assistant-widget">
    <button class="assistant-launcher" type="button" aria-label="Open Abel's Assistant" aria-expanded="false" aria-controls="site-assistant-panel">
      <span aria-hidden="true">✦</span>
    </button>
    <section class="assistant-panel" id="site-assistant-panel" aria-label="Abel's Assistant" hidden>
      <header class="assistant-header">
        <div class="assistant-heading"><strong>Abel's Assistant</strong><span>Ask about the restaurant</span></div>
        <button class="assistant-close" type="button" aria-label="Close assistant">×</button>
      </header>
      <div class="assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
        <div class="assistant-message assistant-message--bot"><p>Hi! What would you like to know about our menu, opening hours, or placing an order?</p></div>
      </div>
      <div class="assistant-prompts" aria-label="Suggested questions">
        <button type="button" data-assistant-question="What's on the menu?">Menu</button>
        <button type="button" data-assistant-question="What are your opening hours?">Hours</button>
        <button type="button" data-assistant-question="How do I place an order?">Ordering</button>
      </div>
      <form class="assistant-form">
        <label class="sr-only" for="assistant-question">Ask Abel's Assistant</label>
        <input id="assistant-question" name="question" type="text" maxlength="240" placeholder="Type your question..." autocomplete="off" required>
        <button type="submit" aria-label="Send question"><span aria-hidden="true">↑</span></button>
      </form>
      <p class="assistant-disclaimer">Demo helper · No AI service or live ordering connected.</p>
    </section>
  </div>
`);

const assistantWidget = document.querySelector(".assistant-widget");
const assistantLauncher = assistantWidget.querySelector(".assistant-launcher");
const assistantPanel = assistantWidget.querySelector(".assistant-panel");
const assistantClose = assistantWidget.querySelector(".assistant-close");
const assistantMessages = assistantWidget.querySelector(".assistant-messages");
const assistantForm = assistantWidget.querySelector(".assistant-form");
const assistantInput = assistantWidget.querySelector("#assistant-question");

function setAssistantOpen(isOpen) {
  assistantPanel.hidden = !isOpen;
  assistantLauncher.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) assistantInput.focus();
  else assistantLauncher.focus();
}

// Match common questions to accurate demo-site information without a network request.
function getAssistantAnswer(question) {
  const text = question.toLowerCase();

  if (/order|checkout|delivery|take.?out|takeaway/.test(text)) {
    return "Use the Orders page to send your dish choices, pickup or delivery request, and contact details through WhatsApp. The restaurant must confirm availability and details; this demo has no online payment or live checkout.";
  }
  if (/hour|open|close|when/.test(text)) {
    return "The sample hours are Tuesday–Sunday, 5:00 PM–10:00 PM, and closed Monday. These hours are placeholders for the demo.";
  }
  if (/where|location|address|direction|map/.test(text)) {
    return "The address on this demo site is a placeholder, not a real restaurant location. Check the Contact page for the sample details.";
  }
  if (/phone|contact|email|call/.test(text)) {
    return "The sample contact details are +1 (555) 123-4567 and hello@example.com. They are placeholders; see the Contact page.";
  }
  if (/menu|dish|food|eat|jollof|waakye|banku|kenkey|fufu|kelewele|price|cost|fish|soup|tilapia|plantain|grill|okra|rice|beans|shito/.test(text)) {
    return "The sample menu features Ghanaian jollof (GH₵ 85), waakye (GH₵ 75), banku with grilled fish (GH₵ 90), beans with plantain (GH₵ 65), and more. Prices are sample amounts in Ghana cedis. Visit the Menu page to browse the dishes.";
  }
  if (/name|restaurant|abel/.test(text)) {
    return "You're chatting with Abel's Assistant for Abel's Restaurant Demo, a sample restaurant site celebrating Ghanaian favorites.";
  }
  return "I can help with the menu, sample opening hours, contact details, or placing an order. Try asking about one of those.";
}

function addAssistantMessage(message, type) {
  const bubble = document.createElement("div");
  bubble.className = `assistant-message assistant-message--${type}`;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  bubble.append(paragraph);
  assistantMessages.append(bubble);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function askAssistant(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  addAssistantMessage(cleanQuestion, "visitor");
  addAssistantMessage(getAssistantAnswer(cleanQuestion), "bot");
}

assistantLauncher.addEventListener("click", () => {
  setAssistantOpen(assistantPanel.hidden);
});
assistantClose.addEventListener("click", () => setAssistantOpen(false));
assistantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!assistantForm.reportValidity()) return;
  askAssistant(assistantInput.value);
  assistantForm.reset();
  assistantInput.focus();
});
assistantWidget.querySelectorAll("[data-assistant-question]").forEach((button) => {
  button.addEventListener("click", () => {
    askAssistant(button.dataset.assistantQuestion);
    assistantInput.focus();
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !assistantPanel.hidden) setAssistantOpen(false);
});
