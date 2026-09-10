// HireCompass Browser Extension Content Script

(function () {
  // Prevent double injection
  if (window.__hirecompass_injected) return;
  window.__hirecompass_injected = true;

  // ─── Auto-Sync Session if browsing HireCompass ──────────────────────────
  function syncHireCompassSession() {
    try {
      const isHireCompassPage =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        document.title.toLowerCase().includes("hirecompass") ||
        document.querySelector('meta[name="application-name"][content="HireCompass"]');

      if (isHireCompassPage) {
        fetch("/api/extension/token", { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data && data.token) {
              chrome.runtime.sendMessage({
                action: "SYNC_TOKEN",
                token: data.token,
                user: data.user,
                host: window.location.origin,
              });
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }

  syncHireCompassSession();
  setTimeout(syncHireCompassSession, 1200);

  // ─── Extractors ──────────────────────────────────────────────────────────

  function extractJSONLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent || "{}");
        const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
        for (const item of items) {
          if (item["@type"] === "JobPosting") {
            const company =
              (item.hiringOrganization && item.hiringOrganization.name) ||
              (typeof item.hiringOrganization === "string" ? item.hiringOrganization : null);
            const location =
              item.jobLocation && item.jobLocation.address
                ? typeof item.jobLocation.address === "string"
                  ? item.jobLocation.address
                  : `${item.jobLocation.address.addressLocality || ""} ${item.jobLocation.address.addressRegion || ""}`.trim()
                : null;
            let salary = null;
            if (item.baseSalary) {
              const val = item.baseSalary.value;
              if (typeof val === "object") {
                salary = `${val.minValue || ""} - ${val.maxValue || ""} ${val.unitText || ""}`.trim();
              } else if (typeof val === "string" || typeof val === "number") {
                salary = String(val);
              }
            }

            return {
              title: item.title || null,
              company,
              location,
              salary,
              description: item.description ? stripHtml(item.description) : null,
              employmentType: item.employmentType || "FULL_TIME",
              sourcePlatform: detectPlatform(window.location.href),
            };
          }
        }
      } catch (e) {
        // Continue searching
      }
    }
    return null;
  }

  function detectPlatform(url) {
    if (url.includes("linkedin.com")) return "LINKEDIN";
    if (url.includes("indeed.com")) return "INDEED";
    if (url.includes("glassdoor.com")) return "GLASSDOOR";
    if (url.includes("wellfound.com") || url.includes("angel.co")) return "ANGELLIST";
    if (url.includes("greenhouse.io")) return "GREENHOUSE";
    if (url.includes("lever.co")) return "LEVER";
    if (url.includes("internshala.com")) return "INTERNSHALA";
    return "OTHER";
  }

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function extractLinkedIn() {
    const titleEl =
      document.querySelector(".job-details-jobs-unified-top-card__job-title") ||
      document.querySelector(".jobs-unified-top-card__job-title") ||
      document.querySelector("h1.t-24") ||
      document.querySelector(".jobs-details__main-content h1");

    const companyEl =
      document.querySelector(".job-details-jobs-unified-top-card__company-name") ||
      document.querySelector(".jobs-unified-top-card__company-name") ||
      document.querySelector('a[href*="/company/"]');

    const locationEl =
      document.querySelector(".job-details-jobs-unified-top-card__bullet") ||
      document.querySelector(".jobs-unified-top-card__bullet") ||
      document.querySelector(".jobs-unified-top-card__workplace-type");

    const descEl =
      document.querySelector("#job-details") ||
      document.querySelector(".jobs-description__content") ||
      document.querySelector(".jobs-box__html-content");

    const insightEls = document.querySelectorAll(".job-details-jobs-unified-top-card__job-insight");
    let salary = null;
    let isRemote = false;

    insightEls.forEach((el) => {
      const text = el.textContent || "";
      if (text.includes("$") || text.includes("₹") || text.includes("€") || text.includes("/yr") || text.includes("/hr")) {
        salary = text.trim();
      }
      if (text.toLowerCase().includes("remote")) isRemote = true;
    });

    const pageText = document.body.innerText.toLowerCase();
    if (pageText.includes("remote")) isRemote = true;

    return {
      title: titleEl ? titleEl.textContent.trim() : null,
      company: companyEl ? companyEl.textContent.trim() : null,
      location: locationEl ? locationEl.textContent.trim() : null,
      salary,
      isRemote,
      description: descEl ? descEl.innerText.trim() : null,
      sourcePlatform: "LINKEDIN",
    };
  }

  function extractIndeed() {
    const titleEl =
      document.querySelector("h1.jobsearch-JobInfoHeader-title") ||
      document.querySelector(".jobsearch-JobInfoHeader-title span") ||
      document.querySelector("h2.jobTitle");

    const companyEl =
      document.querySelector('[data-company-name="true"]') ||
      document.querySelector('[data-testid="inlineHeader-companyName"]') ||
      document.querySelector(".jobsearch-CompanyInfoContainer a");

    const locationEl =
      document.querySelector('[data-testid="job-location"]') ||
      document.querySelector('[data-testid="inlineHeader-companyLocation"]') ||
      document.querySelector("#jobLocationText");

    const salaryEl =
      document.querySelector("#salaryInfoAndJobType") ||
      document.querySelector('[data-testid="attribute_snippet_testid"]');

    const descEl =
      document.querySelector("#jobDescriptionText") ||
      document.querySelector(".jobsearch-jobDescriptionText");

    return {
      title: titleEl ? titleEl.textContent.trim() : null,
      company: companyEl ? companyEl.textContent.trim() : null,
      location: locationEl ? locationEl.textContent.trim() : null,
      salary: salaryEl ? salaryEl.textContent.trim() : null,
      isRemote: (document.body.innerText || "").toLowerCase().includes("remote"),
      description: descEl ? descEl.innerText.trim() : null,
      sourcePlatform: "INDEED",
    };
  }

  function extractGreenhouseOrLever() {
    const isGreenhouse = window.location.href.includes("greenhouse.io");
    const isLever = window.location.href.includes("lever.co");

    if (isGreenhouse) {
      const titleEl = document.querySelector(".app-title") || document.querySelector("h1.heading");
      const companyEl = document.querySelector(".company-name") || document.querySelector("title");
      const locationEl = document.querySelector(".location");
      const descEl = document.querySelector("#content") || document.querySelector(".content");

      return {
        title: titleEl ? titleEl.textContent.trim() : null,
        company: companyEl ? companyEl.textContent.replace(/Careers/i, "").trim() : null,
        location: locationEl ? locationEl.textContent.trim() : null,
        description: descEl ? descEl.innerText.trim() : null,
        sourcePlatform: "COMPANY_SITE",
      };
    }

    if (isLever) {
      const titleEl = document.querySelector(".posting-headline h2");
      const companyEl = document.querySelector(".main-header-logo img") || document.querySelector("title");
      const locationEl = document.querySelector(".posting-categories .location");
      const descEl = document.querySelector(".section-wrapper.page-full-width") || document.querySelector(".content");

      return {
        title: titleEl ? titleEl.textContent.trim() : null,
        company: companyEl ? (companyEl.alt || companyEl.textContent || "").replace(/Jobs/i, "").trim() : null,
        location: locationEl ? locationEl.textContent.trim() : null,
        description: descEl ? descEl.innerText.trim() : null,
        sourcePlatform: "COMPANY_SITE",
      };
    }

    return null;
  }

  function extractGeneric() {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const docTitle = document.title || "";
    const h1 = document.querySelector("h1")?.textContent?.trim();

    let title = h1 || ogTitle || docTitle;
    let company = null;

    if (title && (title.includes(" at ") || title.includes(" - ") || title.includes(" | "))) {
      const parts = title.split(/\sat\s| - | \| /i);
      if (parts.length >= 2) {
        title = parts[0].trim();
        company = parts[1].trim();
      }
    }

    const descMeta = document.querySelector('meta[name="description"]')?.getAttribute("content");
    const mainEl = document.querySelector("main") || document.querySelector("article") || document.body;

    return {
      title: title || "Job Opening",
      company: company || "Company",
      location: null,
      salary: null,
      isRemote: (document.body.innerText || "").toLowerCase().includes("remote"),
      description: descMeta || mainEl.innerText.slice(0, 3500),
      sourcePlatform: detectPlatform(window.location.href),
    };
  }

  // Combined master extractor
  function extractCurrentJob() {
    const url = window.location.href;
    let job = null;

    if (url.includes("linkedin.com")) {
      job = extractLinkedIn();
    } else if (url.includes("indeed.com")) {
      job = extractIndeed();
    } else if (url.includes("greenhouse.io") || url.includes("lever.co")) {
      job = extractGreenhouseOrLever();
    }

    if (!job || !job.title || !job.company) {
      const jsonLd = extractJSONLD();
      if (jsonLd && jsonLd.title && jsonLd.company) {
        job = { ...jsonLd, ...job };
      }
    }

    if (!job || !job.title) {
      job = extractGeneric();
    }

    job.url = url;
    // Capture full raw page text dump for AI parser
    job.rawText = (document.body ? document.body.innerText : "").slice(0, 15000);
    return job;
  }

  // Extract Recruiter info on LinkedIn profiles
  function extractLinkedInProfile() {
    if (!window.location.href.includes("linkedin.com/in/")) return null;

    const nameEl = document.querySelector("h1.text-heading-xlarge") || document.querySelector("h1");
    const headlineEl = document.querySelector(".text-body-medium") || document.querySelector(".pv-text-details__left-panel h2");
    const companyEl = document.querySelector('[aria-label="Current company"]') || document.querySelector(".pv-text-details__right-panel .inline-show-more-text");

    return {
      name: nameEl ? nameEl.textContent.trim() : "there",
      headline: headlineEl ? headlineEl.textContent.trim() : "",
      company: companyEl ? companyEl.textContent.trim() : "",
      url: window.location.href,
    };
  }

  // ─── Floating In-Page Widget ──────────────────────────────────────────────

  function createFloatingBadge() {
    const url = window.location.href;
    const isJobBoard =
      url.includes("/jobs/") ||
      url.includes("/viewjob") ||
      url.includes("greenhouse.io") ||
      url.includes("lever.co") ||
      url.includes("wellfound.com/jobs") ||
      url.includes("glassdoor.com/Job");

    if (!isJobBoard) return;
    if (document.getElementById("hirecompass-floating-root")) return;

    const root = document.createElement("div");
    root.id = "hirecompass-floating-root";
    root.className = "hc-floating-container";

    root.innerHTML = `
      <div class="hc-badge-btn" id="hc-badge-btn" title="HireCompass Copilot">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
        <span class="hc-badge-text">Import Job</span>
      </div>
      <div class="hc-floating-card" id="hc-floating-card" style="display: none;">
        <div class="hc-card-header">
          <div class="hc-brand">
            <span class="hc-logo-dot"></span>
            <strong>HireCompass</strong>
          </div>
          <button class="hc-close-btn" id="hc-card-close">&times;</button>
        </div>
        <div class="hc-card-body" id="hc-card-body">
          <div class="hc-preview-title" id="hc-preview-title">Detecting job...</div>
          <div class="hc-preview-company" id="hc-preview-company">...</div>
          <button class="hc-import-action-btn" id="hc-quick-import-btn">
            Import to Dashboard
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const btn = document.getElementById("hc-badge-btn");
    const card = document.getElementById("hc-floating-card");
    const close = document.getElementById("hc-card-close");
    const importBtn = document.getElementById("hc-quick-import-btn");

    btn.addEventListener("click", () => {
      const isVisible = card.style.display !== "none";
      if (!isVisible) {
        const job = extractCurrentJob();
        document.getElementById("hc-preview-title").textContent = job.title || "Job Opening";
        document.getElementById("hc-preview-company").textContent = `${job.company || "Company"} • ${job.location || "Location"}`;
      }
      card.style.display = isVisible ? "none" : "block";
    });

    close.addEventListener("click", () => {
      card.style.display = "none";
    });

    importBtn.addEventListener("click", async () => {
      importBtn.disabled = true;
      importBtn.textContent = "Importing...";
      const job = extractCurrentJob();

      chrome.runtime.sendMessage(
        {
          action: "API_CALL",
          endpoint: "/api/extension/import",
          method: "POST",
          body: job,
        },
        (res) => {
          if (res && res.ok && res.data) {
            importBtn.textContent = res.data.isDuplicate ? "Already in Pipeline" : "Imported to Dashboard";
            importBtn.style.background = "#10b981";
            setTimeout(() => {
              card.style.display = "none";
              importBtn.disabled = false;
              importBtn.textContent = "Import to Dashboard";
              importBtn.style.background = "";
            }, 2500);
          } else {
            importBtn.disabled = false;
            importBtn.textContent = "Error (Check Login)";
            importBtn.style.background = "#ef4444";
          }
        }
      );
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "EXTRACT_JOB") {
      const job = extractCurrentJob();
      sendResponse({ job });
      return true;
    }

    if (req.action === "EXTRACT_PROFILE") {
      const profile = extractLinkedInProfile();
      sendResponse({ profile });
      return true;
    }

    if (req.action === "TRIGGER_QUICK_IMPORT") {
      const job = extractCurrentJob();
      chrome.runtime.sendMessage(
        {
          action: "API_CALL",
          endpoint: "/api/extension/import",
          method: "POST",
          body: job,
        },
        (res) => {
          if (res && res.ok) {
            alert(`HireCompass: Imported "${job.title}" at ${job.company}`);
          } else {
            alert(`HireCompass: Could not import. Please ensure you are logged in.`);
          }
        }
      );
    }
  });

  // Inject floating button when document is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createFloatingBadge);
  } else {
    createFloatingBadge();
  }
})();
