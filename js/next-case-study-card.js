(function () {
  var nextCaseStudyMap = {
    "/work/biz2x": {
      href: "/work/jio",
      title: "Established the design foundation for JioTesseract's mixed reality platform across SDKs, system apps, and system UI",
      logoSrc: "Assets/JioLogo.png",
      logoAlt: "Jio logo",
      hook: "Lending systems to spatial systems",
    },
    "/work/saison-omni": {
      href: "/work/biz2x",
      title: "Cut lender onboarding time to UAT by 60% with a configurable application framework",
      logoSrc: "Assets/Biz2X-logo.png",
      logoAlt: "Biz2X logo",
      hook: "Another lens on lending infrastructure",
    },
    "/work/jio": {
      href: "/work/mentorconnect",
      title: "Improved student's perfprmance and subscription renewal for India's largest EduTech.",
      logoSrc: "Assets/BYJU'SLogo.png",
      logoAlt: "BYJU'S logo",
      hook: "Platform design to guidance systems",
    },
    "/work/whatsapp": {
      href: "/work/mentorconnect",
      title: "Improved student's perfprmance and subscription renewal for India's largest EduTech.",
      logoSrc: "Assets/BYJU'SLogo.png",
      logoAlt: "BYJU'S logo",
      hook: "From nudges to long-term support",
    },
    "/work/mentorconnect": {
      href: "/work/surakshacentral",
      title: "SafCa by Suraksha Central: A product design case study",
      logoSrc: "Assets/AanganLogo.png",
      logoAlt: "Aangan logo",
      hook: "Mentoring workflows to audit systems",
    },
    "/work/surakshacentral": {
      href: "/work/biz2x",
      title: "Enterprise lending stack at Biz2X: A product design case study",
      logoSrc: "Assets/Biz2X-logo.png",
      logoAlt: "Biz2X logo",
      hook: "Audit infrastructure to lending workflows",
    },
    "/work/spillproof": {
      href: "/work/biz2x",
      title: "Enterprise lending stack at Biz2X: A product design case study",
      logoSrc: "Assets/Biz2X-logo.png",
      logoAlt: "Biz2X logo",
      hook: "Accessibility to enterprise complexity",
    }
  };

  function normalizePathname(pathname) {
    if (!pathname) {
      return "";
    }

    var normalized = pathname.toLowerCase();
    if (normalized.length > 1 && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    if (normalized.endsWith("/index.html")) {
      normalized = normalized.slice(0, -11);
    }
    return normalized;
  }

  function buildCard(config) {
    var shell = document.createElement("section");
    shell.className = "section next-case-study-shell";
    shell.setAttribute("aria-label", "Next case study");

    var headingBlock = document.createElement("div");
    headingBlock.className = "section-heading-block";
    headingBlock.setAttribute("aria-hidden", "true");

    var contentBlock = document.createElement("div");
    contentBlock.className = "content-section-block next-case-study-content";

    var link = document.createElement("a");
    link.className = "next-case-study-card";
    link.href = config.href;

    var copy = document.createElement("div");
    copy.className = "next-case-study-copy";

    var top = document.createElement("div");
    top.className = "next-case-study-top";

    var hook = document.createElement("p");
    hook.className = "next-case-study-hook";
    hook.textContent = config.hook;

    var brand = document.createElement("div");
    brand.className = "next-case-study-brand";

    var logo = document.createElement("img");
    logo.className = "next-case-study-logo";
    logo.src = config.logoSrc;
    logo.alt = config.logoAlt;

    var title = document.createElement("h3");
    title.className = "next-case-study-title";
    title.textContent = config.title;

    var cta = document.createElement("div");
    cta.className = "next-case-study-cta";
    cta.textContent = "Open case study ->";

    brand.appendChild(logo);
    top.appendChild(hook);
    top.appendChild(brand);
    copy.appendChild(top);
    copy.appendChild(title);
    copy.appendChild(cta);
    link.appendChild(copy);
    contentBlock.appendChild(link);
    shell.appendChild(headingBlock);
    shell.appendChild(contentBlock);

    return shell;
  }

  function initNextCaseStudyCard() {
    if (!document.body.classList.contains("case-study-page")) {
      return;
    }

    var pathname = normalizePathname(window.location.pathname);
    var config = nextCaseStudyMap[pathname];
    if (!config) {
      return;
    }

    var projectContent = document.querySelector(".project-content");
    if (!projectContent || projectContent.querySelector(".next-case-study-shell")) {
      return;
    }

    projectContent.appendChild(buildCard(config));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNextCaseStudyCard);
  } else {
    initNextCaseStudyCard();
  }
})();
