document.addEventListener("DOMContentLoaded", () => {
  const typeIcons = {
    Text: "<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M4 6h16M9 6v14M15 6v14\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>",
    Image: "<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M4 7h16v12H4z\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\"/><path d=\"M7 15l3-3 4 4 3-2 3 3\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    Chart: "<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M5 19V9M10 19V5M15 19v-7M20 19v-11\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>",
    Timeline: "<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M6 7h12M6 12h8M6 17h12\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>",
    KPI: "<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M6 19h12M8 16l3-3 2 2 5-6\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    Quote: "<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M7 11h4v8H5v-6l2-2zm10 0h4v8h-6v-6l2-2z\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\"2\" stroke-linejoin=\"round\"/></svg>",
  };

  function readInlineContent(){
    const el = document.getElementById("content-data");
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      console.warn("Invalid inline content-data JSON.", err);
      return null;
    }
  }

  async function loadContentData(){
    const inline = readInlineContent();
    if (inline) return inline;
    try {
      const response = await fetch("content.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`content.json request failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn("Unable to load content.json. Run a local server for this page.", err);
      return null;
    }
  }

  function renderLinks(containerId, links){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = links.map(link => (
      `<a href=\"${link.href}\">${link.label}</a>`
    )).join("");
  }

  function renderCards(containerId, cards){
    const container = document.getElementById(containerId);
    if (!container) return;
    const showMedia = container.dataset.media !== "false";
    const showPrice = container.dataset.price === "true";
    container.innerHTML = cards.map(card => {
      const btnVariant = card.featured ? "coral" : "ghost";
      const btnText = card.price === "Custom" ? "Contact sales" : "Get started";
      return (
        `<div class="card${card.featured ? " card--featured" : ""}" data-tone="${card.tone}">` +
          (showMedia ? (() => {
            const label = card.mediaLabel || card.title;
            const imageSrc = card.imageSrc;
            const imageAlt = card.imageAlt || label;
            if (imageSrc) {
              return `<div class="cardMedia" data-tone="${card.tone}"><img src="${imageSrc}" alt="${imageAlt}" loading="lazy" decoding="async" /></div>`;
            }
            return `<div class="cardMedia" data-tone="${card.tone}"><span>${label}</span></div>`;
          })() : "") +
          `<strong>${card.label}</strong>` +
          `<h3>${card.title}</h3>` +
          `<p>${card.body}</p>` +
          (showPrice && card.price ? (
            `<div class="cardPrice">` +
              `<span class="priceValue">${card.price}</span>` +
              (card.priceNote ? `<span class="priceNote">${card.priceNote}</span>` : ``) +
            `</div>`
          ) : "") +
          (showPrice && Array.isArray(card.features) ? (
            `<ul class="cardList">` +
              card.features.map(item => `<li>${item}</li>`).join("") +
            `</ul>`
          ) : "") +
          (showPrice ? `<button class="btn cardBtn" data-variant="${btnVariant}">${btnText}</button>` : "") +
        `</div>`
      );
    }).join("");
  }

  function renderTypePicker(containerId, types){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = types.map(type => (
      `<button class=\"typeItem\" type=\"button\" data-type=\"${type}\" aria-pressed=\"false\">${typeIcons[type] || ""}${type}</button>`
    )).join("");
  }

  function renderShowcase(containerId, items){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map((item, index) => (
      `<button class="showcaseStep" type="button" ` +
        `data-tone="${item.tone || "blue"}" ` +
        `data-slide="${index % 4}" ` +
        `data-label="${item.label || item.title}" ` +
        `data-tag="${item.tag || "Panel"}" ` +
        `data-chip="${item.chip || item.title}" ` +
        `data-note="${item.note || ""}" ` +
        `data-desc="${item.desc || ""}">` +
        `<span class="showcaseIndex">${String(index + 1).padStart(2, "0")}</span>` +
        `<div class="showcaseBody">` +
          `<h3>${item.title}</h3>` +
          `<p>${item.desc}</p>` +
        `</div>` +
      `</button>`
    )).join("");
  }

  function hydrateContent(data){
    const navLinks = data?.navLinks || [];
    const cards = data?.cards || {};
    const panelTypes = data?.panelTypes || Object.keys(typeIcons);
    const showcase = data?.showcase || [];

    renderLinks("navLinks", navLinks);
    renderLinks("mobileMenu", navLinks);
    renderCards("pricingCards", cards.pricing || []);
    renderTypePicker("typeGrid", panelTypes);
    renderShowcase("showcaseSteps", showcase);
    setupShowcase();
    setupShowcaseInteractions();
    setupCardScroll();
    setupLayoutDemo();
    setupSnowyChat();
    setupPreviewDecks();
  }

  function setupLayoutDemo() {
    const options = document.querySelectorAll(".layoutOption");
    if (!options.length) return;

    options.forEach((opt) => {
      opt.addEventListener("mouseenter", () => {
        options.forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");
      });
    });
  }

  function setupSnowyChat() {
    const chatMessages = document.getElementById("chatMessages");
    const previewContent = document.getElementById("previewContent");
    const previewTitle = document.getElementById("previewTitle");
    const previewSlide = document.getElementById("previewSlide");
    const snowyPills = document.getElementById("snowyPills");

    if (!chatMessages || !previewContent) return;

    const conversations = [
      {
        messages: [
          { type: "user", text: "Can you add a chart showing Q3 revenue?" },
          { type: "ollie", text: "Done! I've added a bar chart to slide 4 with Q3 revenue data from your connected spreadsheet." }
        ],
        preview: "chart",
        pillIndex: 0
      },
      {
        messages: [
          { type: "user", text: "Make the title on slide 2 bigger" },
          { type: "ollie", text: "I've increased the title size to 48px. Want me to apply this to all slides?" }
        ],
        preview: "title",
        pillIndex: 1
      },
      {
        messages: [
          { type: "user", text: "Change the color scheme to blue" },
          { type: "ollie", text: "Updated! All accent colors are now using your brand blue. The charts and icons match too." }
        ],
        preview: "colors",
        pillIndex: 2
      },
      {
        messages: [
          { type: "user", text: "Add an image to the intro slide" },
          { type: "ollie", text: "Created a custom illustration that matches your brand style. It shows a team collaborating on data." }
        ],
        preview: "image",
        pillIndex: 3
      },
      {
        messages: [
          { type: "user", text: "Update the data to show this month's numbers" },
          { type: "ollie", text: "Done! I've pulled the latest figures from your connected spreadsheet. Revenue is up 23%!" }
        ],
        preview: "data",
        pillIndex: 4
      }
    ];

    let currentIndex = 0;
    let autoAdvanceTimer = null;
    let isAnimating = false;
    let abortController = null;

    // Typing animation with abort support
    function typeMessage(element, text, speed = 25, signal) {
      return new Promise((resolve, reject) => {
        let i = 0;
        element.textContent = "";
        const interval = setInterval(() => {
          if (signal?.aborted) {
            clearInterval(interval);
            reject(new Error("aborted"));
            return;
          }
          element.textContent = text.slice(0, ++i);
          if (i >= text.length) {
            clearInterval(interval);
            resolve();
          }
        }, speed);

        // Clear interval if aborted
        signal?.addEventListener("abort", () => {
          clearInterval(interval);
          reject(new Error("aborted"));
        });
      });
    }

    // Cancel current animation
    function cancelAnimation() {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      isAnimating = false;
    }

    // Create typing indicator element
    function createTypingIndicator() {
      const typing = document.createElement("div");
      typing.className = "chatTyping";
      typing.innerHTML = "<span></span><span></span><span></span>";
      return typing;
    }

    // Preview animations
    function showPreview(type) {
      previewContent.innerHTML = "";
      previewTitle.classList.remove("enlarged");
      previewSlide.removeAttribute("data-theme");

      switch (type) {
        case "chart":
          previewContent.innerHTML = `
            <div class="previewChart">
              <div class="previewBar"></div>
              <div class="previewBar"></div>
              <div class="previewBar"></div>
              <div class="previewBar"></div>
              <div class="previewBar"></div>
            </div>
          `;
          setTimeout(() => {
            previewContent.querySelectorAll(".previewBar").forEach(bar => {
              bar.classList.add("animate");
            });
          }, 400);
          break;

        case "title":
          previewContent.innerHTML = `
            <div class="previewPlaceholder">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
            </div>
          `;
          setTimeout(() => {
            previewTitle.classList.add("enlarged");
          }, 400);
          break;

        case "colors":
          previewContent.innerHTML = `
            <div class="previewChart">
              <div class="previewBar"></div>
              <div class="previewBar"></div>
              <div class="previewBar"></div>
              <div class="previewBar"></div>
              <div class="previewBar"></div>
            </div>
          `;
          setTimeout(() => {
            previewSlide.setAttribute("data-theme", "blue");
            previewContent.querySelectorAll(".previewBar").forEach(bar => {
              bar.classList.add("animate");
            });
          }, 400);
          break;

        case "image":
          previewContent.innerHTML = `
            <div class="previewImage">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="9" cy="10" r="2" stroke="currentColor" stroke-width="2"/>
                <path d="M4 15l4-4 3 3 5-5 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          `;
          setTimeout(() => {
            const img = previewContent.querySelector(".previewImage");
            if (img) img.classList.add("animate");
          }, 400);
          break;

        case "data":
          previewContent.innerHTML = `
            <div class="previewData">
              <div class="previewKPI">
                <div class="value" data-target="847">0</div>
                <div class="label">Revenue (K)</div>
              </div>
              <div class="previewKPI">
                <div class="value" data-target="23">0</div>
                <div class="label">Growth %</div>
              </div>
            </div>
          `;
          setTimeout(() => {
            previewContent.querySelectorAll(".previewKPI .value").forEach(el => {
              const target = parseInt(el.dataset.target) || 0;
              animateNumber(el, target);
            });
          }, 400);
          break;

        default:
          previewContent.innerHTML = `
            <div class="previewPlaceholder">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
            </div>
          `;
      }
    }

    // Number count-up animation
    function animateNumber(element, target, duration = 1200) {
      const start = 0;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    }

    // Update pills with fill animation
    function updatePills(pillIndex) {
      if (!snowyPills) return;
      snowyPills.querySelectorAll(".snowyPill").forEach((pill, i) => {
        // Remove active from all, add no-transition to reset
        pill.classList.remove("active");
        pill.classList.add("no-transition");
      });

      // Force reflow
      snowyPills.offsetHeight;

      // Add active to current pill and start fill animation
      snowyPills.querySelectorAll(".snowyPill").forEach((pill, i) => {
        pill.classList.remove("no-transition");
        if (i === pillIndex) {
          pill.classList.add("active");
        }
      });
    }

    // Abortable delay
    function delay(ms, signal) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("aborted"));
        });
      });
    }

    // Show conversation with typing effect
    async function showConversation(index, animate = true) {
      // Cancel any ongoing animation
      cancelAnimation();

      isAnimating = true;
      abortController = new AbortController();
      const signal = abortController.signal;

      const conv = conversations[index];
      currentIndex = index;

      updatePills(conv.pillIndex);

      // Clear existing messages
      chatMessages.innerHTML = "";

      if (animate) {
        try {
          // Show each message with typing effect
          for (let i = 0; i < conv.messages.length; i++) {
            const msg = conv.messages[i];

            if (msg.type === "ollie") {
              const typing = createTypingIndicator();
              chatMessages.appendChild(typing);
              await delay(800, signal);
              typing.remove();
            }

            const bubble = document.createElement("div");
            bubble.className = `chatBubble chatBubble--${msg.type}`;
            const span = document.createElement("span");
            bubble.appendChild(span);
            chatMessages.appendChild(bubble);

            // Trigger visibility
            requestAnimationFrame(() => {
              bubble.classList.add("visible");
            });

            await typeMessage(span, msg.text, msg.type === "user" ? 20 : 15, signal);

            // Show preview after first Snowy response
            if (msg.type === "ollie" && i === 1) {
              showPreview(conv.preview);
            }

            if (i < conv.messages.length - 1) {
              await delay(300, signal);
            }
          }
        } catch (e) {
          // Animation was aborted, exit silently
          return;
        }
      } else {
        // Instant show (no animation)
        conv.messages.forEach((msg, i) => {
          const bubble = document.createElement("div");
          bubble.className = `chatBubble chatBubble--${msg.type} visible`;
          bubble.innerHTML = `<span>${msg.text}</span>`;
          chatMessages.appendChild(bubble);
        });
        showPreview(conv.preview);
      }

      isAnimating = false;
      abortController = null;
    }

    // Go to specific conversation
    function goToConversation(index, animate = true) {
      clearAutoAdvance();
      showConversation(index, animate);
      startAutoAdvance();
    }

    // Auto-advance timer
    function startAutoAdvance() {
      clearAutoAdvance();

      autoAdvanceTimer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % conversations.length;
        showConversation(nextIndex);
        startAutoAdvance();
      }, 6000);
    }

    function clearAutoAdvance() {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
    }

    // Pill click handlers
    if (snowyPills) {
      snowyPills.querySelectorAll(".snowyPill").forEach(pill => {
        pill.addEventListener("click", () => {
          const pillIndex = parseInt(pill.dataset.index);
          if (!isNaN(pillIndex)) {
            goToConversation(pillIndex);
          }
        });
      });
    }

    // Initialize
    showConversation(0);
    startAutoAdvance();
  }

  function setupPreviewDecks() {
    const decks = document.querySelectorAll(".previewDeck");
    if (!decks.length) return;
    const transparentPixel = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

    decks.forEach((deck) => {
      const frame = deck.querySelector(".previewFrame");
      const image = deck.querySelector(".previewImage");
      const label = deck.querySelector(".previewLabel");
      const count = deck.querySelector(".previewCount");
      if (!frame || !image) return;

      const slides = (deck.dataset.slides || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let index = 0;

      const applySlide = (nextIndex) => {
        if (!slides.length) {
          frame.classList.add("is-empty");
          image.src = transparentPixel;
          if (label) label.textContent = "Preview";
          if (count) count.textContent = "";
          return;
        }

        index = ((nextIndex % slides.length) + slides.length) % slides.length;
        const src = slides[index];
        frame.classList.add("is-empty");
        image.onload = () => {
          frame.classList.remove("is-empty");
        };
        image.onerror = () => {
          frame.classList.add("is-empty");
          image.onerror = null;
          image.src = transparentPixel;
        };
        image.src = src;
        if (label) label.textContent = `Slide ${String(index + 1).padStart(2, "0")}`;
        if (count) count.textContent = `${index + 1} / ${slides.length}`;
      };

      frame.addEventListener("click", () => {
        if (!slides.length) return;
        frame.classList.remove("is-advancing");
        void frame.offsetWidth;
        frame.classList.add("is-advancing");
        applySlide(index + 1);
      });

      applySlide(0);
    });
  }

  function setupCardScroll() {
    const scrollContainers = document.querySelectorAll('[data-scroll="true"]');

    scrollContainers.forEach((container) => {
      if (container.scrollWidth <= container.clientWidth + 2) return;
      const isShowcase = container.classList.contains("showcaseSteps");
      let isDragging = false;
      let startX = 0;
      let startScroll = 0;
      let currentX = 0;

      const getCardWidth = () => {
        const card = container.querySelector(".card, .platformFeature, .showcaseStep, .previewDeck");
        if (!card) return container.clientWidth * 0.85;
        const style = getComputedStyle(container);
        const gap = parseFloat(style.gap) || 12;
        return card.offsetWidth + gap;
      };

      const scrollToNearestCard = (direction) => {
        if (isShowcase) {
          const steps = Array.from(container.querySelectorAll(".showcaseStep"));
          if (!steps.length) return;
          const rect = container.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          let closestIndex = 0;
          let minDistance = Infinity;
          steps.forEach((step, i) => {
            const r = step.getBoundingClientRect();
            const stepCenter = r.left + r.width / 2;
            const distance = Math.abs(stepCenter - centerX);
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = i;
            }
          });
          if (direction < 0) {
            closestIndex = Math.max(0, closestIndex - 1);
          } else if (direction > 0) {
            closestIndex = Math.min(steps.length - 1, closestIndex + 1);
          }
          steps[closestIndex].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          return;
        }

        const cardWidth = getCardWidth();
        const currentScroll = container.scrollLeft;
        let targetIndex;

        if (direction < 0) {
          targetIndex = Math.floor(currentScroll / cardWidth);
        } else if (direction > 0) {
          targetIndex = Math.ceil(currentScroll / cardWidth);
        } else {
          targetIndex = Math.round(currentScroll / cardWidth);
        }

        const targetScroll = targetIndex * cardWidth;
        container.scrollTo({ left: targetScroll, behavior: "smooth" });
      };

      const onStart = (x) => {
        isDragging = true;
        startX = x;
        currentX = x;
        startScroll = container.scrollLeft;
        container.classList.add("is-dragging");
      };

      const onMove = (x) => {
        if (!isDragging) return;
        currentX = x;
        const dx = x - startX;
        container.scrollLeft = startScroll - dx;
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove("is-dragging");

        const dx = currentX - startX;
        const threshold = 30;

        if (Math.abs(dx) > threshold) {
          scrollToNearestCard(dx < 0 ? 1 : -1);
        } else {
          scrollToNearestCard(0);
        }
      };

      // Mouse events
      container.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        onStart(e.pageX);
      });
      container.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        onMove(e.pageX);
      });
      container.addEventListener("mouseup", onEnd);
      container.addEventListener("mouseleave", onEnd);

      // Touch events
      container.addEventListener("touchstart", (e) => {
        onStart(e.touches[0].pageX);
      }, { passive: true });
      container.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        onMove(e.touches[0].pageX);
      }, { passive: true });
      container.addEventListener("touchend", onEnd);
    });
  }

  function setupShowcase(){
    const steps = Array.from(document.querySelectorAll(".showcaseStep"));
    if (!steps.length) return;

    const frame = document.getElementById("showcaseFrame");
    const label = document.getElementById("showcaseLabel");
    const tag = document.getElementById("showcaseTag");
    const chip = document.getElementById("showcaseChip");
    const note = document.getElementById("showcaseNote");
    const desc = document.getElementById("showcaseDesc");
    const stepsContainer = document.getElementById("showcaseSteps");
    const prevBtn = document.getElementById("showcasePrev");
    const nextBtn = document.getElementById("showcaseNext");

    if (!frame || !label || !tag) return;

    let currentIndex = 0;

    const activate = (step) => {
      if (!step) return;
      steps.forEach((item) => item.classList.remove("is-active"));
      step.classList.add("is-active");
      currentIndex = steps.indexOf(step);
      frame.dataset.tone = step.dataset.tone || "blue";
      frame.dataset.slide = step.dataset.slide || "0";
      const activeSlide = frame.dataset.slide;
      frame.querySelectorAll(".deckCard").forEach((card) => {
        card.classList.toggle("is-active", card.dataset.slide === activeSlide);
      });
      label.textContent = step.dataset.label || label.textContent;
      tag.textContent = step.dataset.tag || tag.textContent;
      if (chip) chip.textContent = step.dataset.chip || chip.textContent;
      if (note) note.textContent = step.dataset.note || note.textContent;
      if (desc) desc.textContent = step.dataset.desc || desc.textContent;
    };

    const activateByIndex = (index) => {
      if (!steps.length) return;
      const count = steps.length;
      const nextIndex = ((index % count) + count) % count;
      activate(steps[nextIndex]);
    };

    let dragMoved = false;
    activate(steps[0]);

    // Click handlers
    steps.forEach((step) => {
      step.addEventListener("click", () => {
        if (!dragMoved) activate(step);
      });
    });

    // Arrow navigation
    if (stepsContainer && prevBtn && nextBtn) {
      const updateArrows = () => {
        const maxScroll = stepsContainer.scrollWidth - stepsContainer.clientWidth;
        prevBtn.disabled = stepsContainer.scrollLeft <= 2;
        nextBtn.disabled = stepsContainer.scrollLeft >= maxScroll - 2;
      };

      const scrollByAmount = () => Math.round(stepsContainer.clientWidth * 0.82);

      prevBtn.addEventListener("click", () => {
        stepsContainer.scrollBy({ left: -scrollByAmount(), behavior: "smooth" });
      });
      nextBtn.addEventListener("click", () => {
        stepsContainer.scrollBy({ left: scrollByAmount(), behavior: "smooth" });
      });

      stepsContainer.addEventListener("scroll", updateArrows, { passive: true });
      updateArrows();
    }

    // Scroll sync: update active step based on closest card in view
    if (stepsContainer) {
      let scrollRaf = null;
      const syncToScroll = () => {
        scrollRaf = null;
        const containerRect = stepsContainer.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        let closestStep = steps[0];
        let minDistance = Infinity;
        steps.forEach((step) => {
          const rect = step.getBoundingClientRect();
          const stepCenter = rect.left + rect.width / 2;
          const distance = Math.abs(stepCenter - centerX);
          if (distance < minDistance) {
            minDistance = distance;
            closestStep = step;
          }
        });
        if (closestStep) activate(closestStep);
      };

      stepsContainer.addEventListener("scroll", () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(syncToScroll);
      }, { passive: true });
    }

    // Drag/pointer handlers for mobile (skip when using shared scroll snap)
    if (stepsContainer && stepsContainer.dataset.scroll !== "true") {
      let isDragging = false;
      let startX = 0;
      let startScroll = 0;
      let startStep = null;

      stepsContainer.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        isDragging = true;
        dragMoved = false;
        startX = e.clientX;
        startScroll = stepsContainer.scrollLeft;
        startStep = e.target.closest?.(".showcaseStep") || null;
        stepsContainer.classList.add("is-dragging");
        stepsContainer.setPointerCapture?.(e.pointerId);
      });

      stepsContainer.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 6) {
          dragMoved = true;
        }
        stepsContainer.scrollLeft = startScroll - dx;
        if (dragMoved) e.preventDefault();
      });

      const endDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        stepsContainer.classList.remove("is-dragging");
        stepsContainer.releasePointerCapture?.(e.pointerId);
        if (!dragMoved && startStep) {
          activate(startStep);
        }
        dragMoved = false;
        startStep = null;
      };

      stepsContainer.addEventListener("pointerup", endDrag);
      stepsContainer.addEventListener("pointercancel", endDrag);
      stepsContainer.addEventListener("pointerleave", endDrag);
    }

    // Swipe gestures on the deck itself (touch only)
    const deck = frame.querySelector(".deckMock");
    const enableDeckSwipe = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (deck && enableDeckSwipe) {
      let pointerDown = false;
      let startX = 0;
      let startY = 0;
      let dragged = false;

      deck.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pointerDown = true;
        dragged = false;
        startX = e.clientX;
        startY = e.clientY;
        deck.setPointerCapture?.(e.pointerId);
      });

      deck.addEventListener("pointermove", (e) => {
        if (!pointerDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          dragged = true;
          e.preventDefault();
        }
      });

      const endSwipe = (e) => {
        if (!pointerDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        pointerDown = false;
        deck.releasePointerCapture?.(e.pointerId);
        if (dragged && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          activateByIndex(currentIndex + (dx < 0 ? 1 : -1));
        }
      };

      deck.addEventListener("pointerup", endSwipe);
      deck.addEventListener("pointercancel", endSwipe);
      deck.addEventListener("pointerleave", endSwipe);
    }
  }

  function setupShowcaseInteractions(){
    const frame = document.getElementById("showcaseFrame");
    if (!frame) return;

    const brandKit = frame.querySelector(".brandKit--simple");
    if (brandKit) {
      const previewDot = brandKit.querySelector(".previewDot");
      const swatches = Array.from(brandKit.querySelectorAll(".swatch:not(.add)"));
      swatches.forEach((swatch) => {
        swatch.addEventListener("click", () => {
          swatches.forEach((s) => s.classList.remove("is-active"));
          swatch.classList.add("is-active");
          const color = swatch.dataset.color || "";
          const colorMap = {
            blue: "var(--blue)",
            coral: "var(--coral)",
            orange: "var(--orange)",
          };
          if (previewDot && colorMap[color]) {
            previewDot.style.background = colorMap[color];
          }
        });
      });
    }

    const generateBtn = frame.querySelector('.deckCard[data-slide="2"] .promptAction button');
    if (generateBtn) {
      generateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toast("Generating slides...");
      });
    }

    const editGroups = frame.querySelectorAll(".editChips");
    editGroups.forEach((group) => {
      group.addEventListener("click", (e) => {
        const chip = e.target.closest(".editChip");
        if (!chip) return;
        group.querySelectorAll(".editChip").forEach((btn) => {
          btn.classList.toggle("is-active", btn === chip);
        });
      });
    });

    const interactiveEls = frame.querySelectorAll(
      ".brandSwatches, .promptAction button, .editChip, .exportChip"
    );
    interactiveEls.forEach((el) => {
      el.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });
    });
  }

  const dom = {
    yearEl: document.getElementById("year"),
    signupBtn: document.getElementById("signupBtn"),
    generateBtn: document.getElementById("generateBtn"),
    howItWorksBtn: document.getElementById("howItWorksBtn"),
    ctaGenerate: document.getElementById("ctaGenerate"),
    typePicker: document.getElementById("typePicker"),
    typeGrid: document.getElementById("typeGrid"),
    closePicker: document.getElementById("closePicker"),
    uiMock: document.getElementById("uiMock"),
    hamburgerBtn: document.getElementById("hamburgerBtn"),
    mobileMenu: document.getElementById("mobileMenu"),
  };

  loadContentData().then(hydrateContent);

  if (dom.yearEl) {
    dom.yearEl.textContent = new Date().getFullYear();
  }

  function toast(msg){
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "22px";
    t.style.transform = "translateX(-50%)";
    t.style.padding = "12px 14px";
    t.style.borderRadius = "999px";
    t.style.background = "rgba(10,12,16,.92)";
    t.style.border = "1px solid rgba(255,255,255,.16)";
    t.style.color = "rgba(255,255,255,.90)";
    t.style.fontWeight = "800";
    t.style.boxShadow = "0 18px 40px rgba(0,0,0,.35)";
    t.style.zIndex = "9999";
    t.style.opacity = "0";
    t.style.transition = "opacity .14s ease, transform .14s ease";
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity="1"; t.style.transform="translateX(-50%) translateY(-2px)"; });
    setTimeout(()=>{
      t.style.opacity="0";
      t.style.transform="translateX(-50%) translateY(6px)";
      setTimeout(()=>t.remove(), 250);
    }, 1500);
  }

  function bindToast(el, msg){
    if (!el) return;
    el.addEventListener("click", () => toast(msg));
  }

  bindToast(dom.signupBtn, "Sign up flow goes here.");
  bindToast(dom.generateBtn, "This would open the AI generator.");
  bindToast(dom.ctaGenerate, "This would open the AI generator.");

  if (dom.howItWorksBtn) {
    dom.howItWorksBtn.addEventListener("click", () => {
      const target = document.getElementById("features");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  function setMobileMenu(open){
    if (!dom.mobileMenu || !dom.hamburgerBtn) return;
    dom.mobileMenu.hidden = !open;
    dom.hamburgerBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (dom.hamburgerBtn && dom.mobileMenu) {
    dom.hamburgerBtn.addEventListener("click", () => {
      setMobileMenu(dom.mobileMenu.hidden);
    });

    dom.mobileMenu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMobileMenu(false);
    });

    const mobileMQ = window.matchMedia("(max-width: 620px)");
    if (mobileMQ.addEventListener) {
      mobileMQ.addEventListener("change", (e) => {
        if (!e.matches) setMobileMenu(false);
      });
    }
  }

  const layoutGrid = document.getElementById("layoutGrid");
  const titleMap = {
    Text: "Slide Title + Content",
    Image: "Hero Image",
    Chart: "Chart",
    Timeline: "Timeline",
    KPI: "Key Metric",
    Quote: "Quote",
  };
  const layoutCycle = ["focus", "split", "row"];
  const layoutLabels = {
    focus: "Focus layout",
    split: "Split layout",
    row: "Row layout",
  };
  const layoutForType = {
    Text: "focus",
    Quote: "focus",
    Chart: "split",
    KPI: "split",
    Image: "row",
    Timeline: "row",
  };

  let activePanelEl = null;
  let currentLayout = layoutGrid?.dataset?.layout || "focus";

  function showPickerNear(el){
    if (!dom.typePicker) return;
    dom.typePicker.hidden = false;
    dom.typePicker.setAttribute("aria-hidden", "false");
    dom.typePicker.style.visibility = "hidden";

    const r = el.getBoundingClientRect();
    const pickerW = dom.typePicker.offsetWidth || 260;
    const pickerH = dom.typePicker.offsetHeight || 220;

    let left = r.right - pickerW;
    let top = r.top + 12;

    left = Math.max(12, Math.min(left, window.innerWidth - pickerW - 12));
    top  = Math.max(12, Math.min(top,  window.innerHeight - pickerH - 12));

    dom.typePicker.style.left = left + "px";
    dom.typePicker.style.top  = top + "px";
    dom.typePicker.style.visibility = "visible";
    syncPickerSelection(el.dataset.type);
    const first = dom.typeGrid?.querySelector(".typeItem");
    if (first) first.focus();
  }

  function hidePicker(){
    if (!dom.typePicker) return;
    dom.typePicker.hidden = true;
    dom.typePicker.setAttribute("aria-hidden", "true");
    setActivePanel(null);
    activePanelEl = null;
  }

  function setActivePanel(panel){
    document.querySelectorAll(".panel").forEach(p => {
      p.classList.toggle("is-active", p === panel);
    });
  }

  function syncPickerSelection(type){
    if (!dom.typeGrid) return;
    dom.typeGrid.querySelectorAll(".typeItem").forEach(item => {
      const selected = item.dataset.type === type;
      item.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function updatePanelUI(panel, type){
    if (!panel) return;
    panel.dataset.type = type;

    const title = panel.querySelector(".panelTitle");
    if (title) title.textContent = titleMap[type] || type;

    const preview = panel.querySelector(".panelPreview");
    if (preview) {
      preview.innerHTML = `${typeIcons[type] || ""}<span>${type}</span>`;
    }
  }

  function openPickerForPanel(panel){
    if (!panel) return;
    activePanelEl = panel;
    setActivePanel(panel);
    showPickerNear(panel);
  }

  function applyLayout(layout){
    if (!layoutGrid || !layout) return;
    if (layout === currentLayout) return;
    currentLayout = layout;
    layoutGrid.dataset.layout = layout;
    layoutGrid.classList.remove("is-reflow");
    void layoutGrid.offsetWidth;
    layoutGrid.classList.add("is-reflow");
  }

  function suggestLayout(type){
    const preferred = layoutForType[type];
    if (preferred && preferred !== currentLayout) return preferred;
    const index = layoutCycle.indexOf(currentLayout);
    return layoutCycle[(index + 1) % layoutCycle.length];
  }

  document.querySelectorAll(".panel").forEach(panel => {
    const initialType = panel.dataset.type || "Text";
    updatePanelUI(panel, initialType);
    panel.addEventListener("click", () => {
      openPickerForPanel(panel);
    });
    panel.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openPickerForPanel(panel);
      }
    });
  });

  if (dom.closePicker) {
    dom.closePicker.addEventListener("click", hidePicker);
  }

  if (dom.typeGrid) {
    dom.typeGrid.addEventListener("click", (e) => {
      const item = e.target.closest(".typeItem");
      if(!item || !activePanelEl) return;
      const panelToFocus = activePanelEl;
      const type = item.dataset.type;
      updatePanelUI(panelToFocus, type);
      syncPickerSelection(type);

      const suggested = suggestLayout(type);
      applyLayout(suggested, { undoable: true });
      hidePicker();
      panelToFocus.focus();
    });
  }

  document.addEventListener("click", (e) => {
    if (!dom.typePicker || dom.typePicker.hidden) return;
    const clickedInsidePicker = dom.typePicker.contains(e.target);
    const clickedPanel = e.target.closest(".panel");
    if (!clickedInsidePicker && !clickedPanel) hidePicker();
  });

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") {
      hidePicker();
      setMobileMenu(false);
    }
  });

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (dom.uiMock && dom.uiMock.animate && !prefersReducedMotion) {
    dom.uiMock.animate(
      [
        { opacity: 0, transform: "translateY(-6px) scale(.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }
});
