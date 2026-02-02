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
    container.innerHTML = cards.map(card => (
      `<div class=\"card${card.featured ? " card--featured" : ""}\" data-tone=\"${card.tone}\">` +
        (showMedia ? (() => {
          const label = card.mediaLabel || card.title;
          const imageSrc = card.imageSrc;
          const imageAlt = card.imageAlt || label;
          if (imageSrc) {
            return `<div class=\"cardMedia\" data-tone=\"${card.tone}\"><img src=\"${imageSrc}\" alt=\"${imageAlt}\" loading=\"lazy\" decoding=\"async\" /></div>`;
          }
          return `<div class=\"cardMedia\" data-tone=\"${card.tone}\"><span>${label}</span></div>`;
        })() : "") +
        (showPrice && card.price ? (
          `<div class=\"cardPrice\">` +
            `<span class=\"priceValue\">${card.price}</span>` +
            (card.priceNote ? `<span class=\"priceNote\">${card.priceNote}</span>` : ``) +
          `</div>`
        ) : "") +
        (showPrice && Array.isArray(card.features) ? (
          `<ul class=\"cardList\">` +
            card.features.map(item => `<li>${item}</li>`).join("") +
          `</ul>`
        ) : "") +
        `<strong>${card.label}</strong>` +
        `<h3>${card.title}</h3>` +
        `<p>${card.body}</p>` +
      `</div>`
    )).join("");
  }

  function renderTypePicker(containerId, types){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = types.map(type => (
      `<button class=\"typeItem\" type=\"button\" data-type=\"${type}\">${typeIcons[type] || ""}${type}</button>`
    )).join("");
  }

  function renderShowcase(containerId, items){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map((item, index) => (
      `<button class="showcaseStep" type="button" ` +
        `data-tone="${item.tone || "blue"}" ` +
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
    renderLinks("footerLinks", navLinks);
    renderLinks("mobileMenu", navLinks);
    renderCards("featuresCards", cards.features || []);
    renderCards("dataCards", cards.data || []);
    renderCards("pricingCards", cards.pricing || []);
    renderTypePicker("typeGrid", panelTypes);
    renderShowcase("showcaseSteps", showcase);
    setupShowcase();
    setupCardScroll();
  }

  function setupCardScroll() {
    const scrollContainers = document.querySelectorAll('.cards[data-scroll="true"]');

    scrollContainers.forEach((container) => {
      let isDragging = false;
      let startX = 0;
      let startScroll = 0;
      let currentX = 0;

      const getCardWidth = () => {
        const card = container.querySelector(".card");
        if (!card) return container.clientWidth * 0.84;
        const style = getComputedStyle(container);
        const gap = parseFloat(style.gap) || 12;
        return card.offsetWidth + gap;
      };

      const scrollToNearestCard = (direction) => {
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

    if (!frame || !label || !tag || !chip || !note || !desc) return;

    const activate = (step) => {
      if (!step) return;
      steps.forEach((item) => item.classList.remove("is-active"));
      step.classList.add("is-active");
      frame.dataset.tone = step.dataset.tone || "blue";
      label.textContent = step.dataset.label || label.textContent;
      tag.textContent = step.dataset.tag || tag.textContent;
      chip.textContent = step.dataset.chip || chip.textContent;
      note.textContent = step.dataset.note || note.textContent;
      desc.textContent = step.dataset.desc || desc.textContent;
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

    // Drag/pointer handlers for mobile
    if (stepsContainer) {
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

  const badges = {
    A: document.getElementById("badgeA"),
    B: document.getElementById("badgeB"),
    C: document.getElementById("badgeC"),
  };

  const toneMap = {
    Text: "blue",
    Image: "orange",
    Chart: "coral",
    Timeline: "orange",
    KPI: "blue",
    Quote: "coral",
  };

  let activePanelEl = null;

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
  }

  function hidePicker(){
    if (!dom.typePicker) return;
    dom.typePicker.hidden = true;
    dom.typePicker.setAttribute("aria-hidden", "true");
    activePanelEl = null;
  }

  document.querySelectorAll(".panel").forEach(panel => {
    panel.addEventListener("click", () => {
      activePanelEl = panel;
      showPickerNear(panel);
    });
    panel.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        activePanelEl = panel;
        showPickerNear(panel);
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
      const badge = badges[panelToFocus.dataset.panel];

      if (badge) {
        badge.textContent = type;
        badge.dataset.tone = toneMap[type] || "blue";
      }

      toast(`Panel ${panelToFocus.dataset.panel}: ${type}`);
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
