// HireCompass Browser Extension Popup Controller

document.addEventListener("DOMContentLoaded", async () => {
  let currentJob = null;
  let currentProfile = null;
  let appState = null;
  let timerInterval = null;
  let timerSecondsLeft = 25 * 60;
  let isTimerRunning = false;

  // ─── DOM References ───
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const statusUserText = document.getElementById("status-user-text");
  const statusDot = document.querySelector(".status-dot");
  const btnSettingsToggle = document.getElementById("btn-settings-toggle");
  const settingsPanel = document.getElementById("settings-panel");
  const btnSettingsClose = document.getElementById("btn-settings-close");
  const btnSaveSettings = document.getElementById("btn-save-settings");
  const settingHost = document.getElementById("setting-host");
  const settingToken = document.getElementById("setting-token");
  const settingsStatus = document.getElementById("settings-status");

  // Import Tab elements
  const inputTitle = document.getElementById("input-title");
  const inputCompany = document.getElementById("input-company");
  const inputLocation = document.getElementById("input-location");
  const inputSalary = document.getElementById("input-salary");
  const selectStatus = document.getElementById("select-status");
  const badgePlatform = document.getElementById("badge-platform");
  const badgeRemote = document.getElementById("badge-remote");
  const btnImportJob = document.getElementById("btn-import-job");
  const importFeedback = document.getElementById("import-feedback");
  const btnRunMatch = document.getElementById("btn-run-match");
  const matchResultContainer = document.getElementById("match-result-container");
  const matchScoreNum = document.getElementById("match-score-num");
  const matchScoreFill = document.getElementById("match-score-fill");
  const matchedSkillsPills = document.getElementById("matched-skills-pills");
  const missingSkillsPills = document.getElementById("missing-skills-pills");
  const matchAdviceBox = document.getElementById("match-advice-box");
  const btnPrepQuestions = document.getElementById("btn-prep-questions");
  const prepQuestionsList = document.getElementById("prep-questions-list");

  // Outreach Tab elements
  const outreachName = document.getElementById("outreach-name");
  const outreachTitle = document.getElementById("outreach-title");
  const outreachRole = document.getElementById("outreach-role");
  const btnGenerateOutreach = document.getElementById("btn-generate-outreach");
  const outreachResults = document.getElementById("outreach-results");
  const outreachNoteText = document.getElementById("outreach-note-text");
  const outreachInmailText = document.getElementById("outreach-inmail-text");
  const outreachFollowupText = document.getElementById("outreach-followup-text");

  // FormKit elements
  const qcValName = document.getElementById("qc-val-name");
  const qcValEmail = document.getElementById("qc-val-email");
  const qcValPhone = document.getElementById("qc-val-phone");
  const qcValPortfolio = document.getElementById("qc-val-portfolio");
  const qcValGithub = document.getElementById("qc-val-github");
  const qcValLinkedin = document.getElementById("qc-val-linkedin");
  const snippetsList = document.getElementById("snippets-list");

  // Planner elements
  const plannerTaskTitle = document.getElementById("planner-task-title");
  const plannerTaskCat = document.getElementById("planner-task-cat");
  const miniTimerDigits = document.getElementById("mini-timer-digits");
  const btnTimerToggle = document.getElementById("btn-timer-toggle");
  const btnTimerLabel = document.getElementById("btn-timer-label");
  const btnTaskDone = document.getElementById("btn-task-done");

  // Alerts elements
  const alertsList = document.getElementById("alerts-list");
  const alertsCountBadge = document.getElementById("alerts-count-badge");
  const alertsTabLabel = document.getElementById("alerts-tab-label");

  // ─── Tab Navigation ───
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(target)?.classList.add("active");
    });
  });

  // Settings panel toggle
  btnSettingsToggle.addEventListener("click", async () => {
    const data = await chrome.storage.local.get(["customHost", "manualToken"]);
    settingHost.value = data.customHost || "http://localhost:3000";
    settingToken.value = data.manualToken || "";
    settingsPanel.style.display = "flex";
  });

  btnSettingsClose.addEventListener("click", () => {
    settingsPanel.style.display = "none";
  });

  btnSaveSettings.addEventListener("click", async () => {
    btnSaveSettings.disabled = true;
    settingsStatus.textContent = "Testing connection...";
    settingsStatus.style.color = "#94a3b8";
    const host = settingHost.value.trim() || "http://localhost:3000";
    const token = settingToken.value.trim() || null;

    await chrome.storage.local.set({ customHost: host, manualToken: token });

    chrome.runtime.sendMessage({ action: "API_CALL", endpoint: "/api/extension/status" }, (res) => {
      btnSaveSettings.disabled = false;
      if (res && res.ok && res.data && res.data.authenticated) {
        settingsStatus.textContent = `Connected as ${res.data.user.name || res.data.user.email}`;
        settingsStatus.style.color = "#10b981";
        setTimeout(() => {
          settingsPanel.style.display = "none";
          fetchStatus();
        }, 800);
      } else {
        settingsStatus.textContent = res?.error || "Could not connect to HireCompass. Please check URL or token.";
        settingsStatus.style.color = "#f43f5e";
      }
    });
  });

  // ─── API & Data Fetching ───

  let hasAttemptedAutoSync = false;

  function fetchStatus() {
    statusUserText.textContent = "Connecting...";

    const safetyTimeout = setTimeout(() => {
      statusDot.classList.add("disconnected");
      statusUserText.textContent = "Not Connected";
      const authBanner = document.getElementById("auth-banner");
      if (authBanner) authBanner.style.display = "flex";
    }, 2500);

    chrome.runtime.sendMessage({ action: "API_CALL", endpoint: "/api/extension/status" }, (res) => {
      clearTimeout(safetyTimeout);
      const authBanner = document.getElementById("auth-banner");

      if (res && res.ok && res.data && res.data.authenticated) {
        hasAttemptedAutoSync = true;
        appState = res.data;
        statusDot.classList.remove("disconnected");
        statusUserText.textContent = res.data.user.name ? res.data.user.name.split(" ")[0] : "Connected";

        // Update FormKit
        const p = res.data.profile || {};
        qcValName.textContent = p.fullName || "—";
        qcValEmail.textContent = p.email || "—";
        qcValPhone.textContent = p.phone || "—";
        qcValPortfolio.textContent = p.portfolio ? p.portfolio.replace(/^https?:\/\//, "") : "—";
        qcValGithub.textContent = p.github ? p.github.replace(/^https?:\/\//, "") : "—";
        qcValLinkedin.textContent = p.linkedin ? p.linkedin.replace(/^https?:\/\//, "") : "—";

        // Render FormKit Snippets
        const snippets = res.data.formKitSnippets || [];
        if (snippets.length > 0) {
          snippetsList.innerHTML = snippets
            .map(
              (s) => `
              <div class="snippet-card" data-copy="${escapeAttr(s.text)}">
                <div class="snippet-header">
                  <span class="snippet-title">${escapeHtml(s.title)}</span>
                  <span class="badge badge-indigo">${escapeHtml(s.category)}</span>
                </div>
                <div class="snippet-preview">${escapeHtml(s.text)}</div>
              </div>`
            )
            .join("");

          snippetsList.querySelectorAll(".snippet-card").forEach((card) => {
            card.addEventListener("click", () => {
              const text = card.getAttribute("data-copy");
              copyToClipboard(text, card);
            });
          });
        } else {
          snippetsList.innerHTML = `<div class="empty-state">No snippets in FormKit. Add projects in HireCompass.</div>`;
        }

        // Update Today's Planner
        if (res.data.activeTask) {
          const task = res.data.activeTask;
          plannerTaskTitle.textContent = task.title;
          plannerTaskCat.textContent = `${task.category || "Focus"} • ${task.durationMinutes || 30} mins`;
          timerSecondsLeft = (task.durationMinutes || 25) * 60;
          updateTimerDigits();
        } else {
          plannerTaskTitle.textContent = "All tasks completed";
          plannerTaskCat.textContent = "Focus session ready";
        }

        // Update Alerts
        const reminders = res.data.reminders || [];
        alertsCountBadge.textContent = `${reminders.length} Pending`;
        if (reminders.length > 0) {
          alertsTabLabel.textContent = `Alerts (${reminders.length})`;
          alertsList.innerHTML = reminders
            .map(
              (r) => `
              <div class="alert-item">
                <div class="alert-item-info">
                  <span class="alert-item-title">${escapeHtml(r.company || "Job")} – ${escapeHtml(r.jobTitle || r.message || "")}</span>
                  <span class="alert-item-sub">Due: ${new Date(r.dueAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                </div>
                <span class="badge badge-indigo">${r.type || "DEADLINE"}</span>
              </div>`
            )
            .join("");
        } else {
          alertsTabLabel.textContent = "Alerts";
          alertsList.innerHTML = `<div class="empty-state">All caught up. No pending deadlines or follow-ups.</div>`;
        }

        // Hide auth warning banner when connected
        if (authBanner) authBanner.style.display = "none";
      } else {
        if (!hasAttemptedAutoSync) {
          hasAttemptedAutoSync = true;
          chrome.runtime.sendMessage({ action: "DETECT_AND_SYNC" }, (syncRes) => {
            if (syncRes && syncRes.token) {
              fetchStatus();
              return;
            }
            statusDot.classList.add("disconnected");
            statusUserText.textContent = "Not Connected";
            snippetsList.innerHTML = `<div class="empty-state">Please log into HireCompass to sync snippets.</div>`;
            if (authBanner) authBanner.style.display = "flex";
          });
          return;
        }

        statusDot.classList.add("disconnected");
        statusUserText.textContent = "Not Connected";
        snippetsList.innerHTML = `<div class="empty-state">Please log into HireCompass to sync snippets.</div>`;

        // Show auth warning banner
        if (authBanner) authBanner.style.display = "flex";
      }
    });
  }

  // ─── Quick Login & Real-Time Sync Handlers ───
  const btnShowQuickLogin = document.getElementById("btn-show-quick-login");
  const quickLoginForm = document.getElementById("quick-login-form");
  const btnDoLogin = document.getElementById("btn-do-login");
  const btnAutoSync = document.getElementById("btn-auto-sync");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginFeedback = document.getElementById("login-feedback");

  btnAutoSync?.addEventListener("click", () => {
    btnAutoSync.disabled = true;
    btnAutoSync.textContent = "Syncing...";
    chrome.runtime.sendMessage({ action: "DETECT_AND_SYNC", force: true }, (res) => {
      btnAutoSync.disabled = false;
      btnAutoSync.textContent = "Auto-Sync";
      if (res && res.token) {
        fetchStatus();
      } else {
        const qForm = document.getElementById("quick-login-form");
        if (qForm) {
          qForm.style.display = "flex";
          if (btnShowQuickLogin) btnShowQuickLogin.textContent = "Cancel";
          loginEmail?.focus();
        }
        if (loginFeedback) {
          loginFeedback.textContent = "No active tab session found. Sign in below:";
          loginFeedback.style.color = "#94a3b8";
        }
      }
    });
  });

  btnShowQuickLogin?.addEventListener("click", () => {
    const isVis = quickLoginForm.style.display !== "none";
    quickLoginForm.style.display = isVis ? "none" : "flex";
    btnShowQuickLogin.textContent = isVis ? "Sign In" : "Cancel";
    if (!isVis) loginEmail?.focus();
  });

  loginPassword?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnDoLogin?.click();
    }
  });

  loginEmail?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      loginPassword?.focus();
    }
  });

  btnDoLogin?.addEventListener("click", () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
      loginFeedback.textContent = "Please enter email and password.";
      loginFeedback.style.color = "#f43f5e";
      return;
    }
    btnDoLogin.disabled = true;
    loginFeedback.textContent = "Authenticating with HireCompass...";
    loginFeedback.style.color = "#94a3b8";

    chrome.runtime.sendMessage(
      { action: "LOGIN_DIRECT", email, password },
      (res) => {
        btnDoLogin.disabled = false;
        if (res && res.ok) {
          loginFeedback.textContent = "Connected successfully";
          loginFeedback.style.color = "#10b981";
          setTimeout(() => {
            quickLoginForm.style.display = "none";
            const authBanner = document.getElementById("auth-banner");
            if (authBanner) authBanner.style.display = "none";
            fetchStatus();
          }, 600);
        } else {
          loginFeedback.textContent = res?.error || "Login failed. Check email/password or server.";
          loginFeedback.style.color = "#f43f5e";
        }
      }
    );
  });

  // Listen for background cookie / token changes in real-time
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "COOKIE_CHANGED" || msg.action === "TOKEN_SYNCED") {
      fetchStatus();
    }
  });

  // ─── Extract Active Tab Data ───

  async function extractActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Send extract job message to tab
    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_JOB" }, (res) => {
      if (chrome.runtime.lastError || !res || !res.job) {
        badgePlatform.textContent = "Manual Entry";
        return;
      }

      currentJob = res.job;
      inputTitle.value = currentJob.title || "";
      inputCompany.value = currentJob.company || "";
      inputLocation.value = currentJob.location || "";
      inputSalary.value = currentJob.salary || "";
      badgePlatform.textContent = currentJob.sourcePlatform || "OTHER";

      if (currentJob.isRemote) {
        badgeRemote.style.display = "inline-block";
      }

      // Pre-fill Outreach role if available
      if (currentJob.title && currentJob.company) {
        outreachRole.value = `${currentJob.title} at ${currentJob.company}`;
      }
    });

    // Also check if on LinkedIn profile
    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_PROFILE" }, (res) => {
      if (res && res.profile && res.profile.name) {
        currentProfile = res.profile;
        outreachName.value = currentProfile.name;
        outreachTitle.value = currentProfile.headline;
        if (currentProfile.company) {
          outreachRole.value = `Opening at ${currentProfile.company}`;
        }
      }
    });
  }

  // ─── Mode Switching (Active Tab vs Raw JD Dump) ───
  const modeTabDetect = document.getElementById("mode-tab-detect");
  const modeTabPaste = document.getElementById("mode-tab-paste");
  const jobExtractCard = document.getElementById("job-extract-card");
  const jobPasteCard = document.getElementById("job-paste-card");
  const inputRawJd = document.getElementById("input-raw-jd");
  const selectPasteStatus = document.getElementById("select-paste-status");
  const btnAiDumpSave = document.getElementById("btn-ai-dump-save");
  const pasteImportFeedback = document.getElementById("paste-import-feedback");

  modeTabDetect?.addEventListener("click", () => {
    modeTabDetect.classList.add("active");
    modeTabPaste.classList.remove("active");
    jobExtractCard.style.display = "flex";
    jobPasteCard.style.display = "none";
  });

  modeTabPaste?.addEventListener("click", () => {
    modeTabPaste.classList.add("active");
    modeTabDetect.classList.remove("active");
    jobExtractCard.style.display = "none";
    jobPasteCard.style.display = "flex";
    inputRawJd?.focus();
  });

  // ─── AI Raw JD Dump & Auto-Save Handler ───
  btnAiDumpSave?.addEventListener("click", async () => {
    const rawText = inputRawJd.value.trim();
    if (!rawText || rawText.length < 30) {
      showPasteFeedback("Please paste the job description text (min 30 characters).", "error");
      return;
    }

    btnAiDumpSave.disabled = true;
    showPasteFeedback("Parsing JD and auto-saving...", "");

    chrome.runtime.sendMessage(
      {
        action: "API_CALL",
        endpoint: "/api/extension/import",
        method: "POST",
        body: {
          rawText,
          status: selectPasteStatus.value,
        },
      },
      (res) => {
        btnAiDumpSave.disabled = false;
        if (res && res.ok && res.data) {
          const opp = res.data.opportunity || {};
          const title = opp.title || "Job";
          const company = opp.company || "";
          const msg = res.data.isDuplicate
            ? res.data.message
            : `Successfully saved "${title}" at ${company}`;
          showPasteFeedback(msg, "success");
          inputRawJd.value = "";
          chrome.runtime.sendMessage({ action: "REFRESH_BADGE" });

          // Also pre-fill Active Tab inputs with extracted fields
          if (opp.title) inputTitle.value = opp.title;
          if (opp.company) inputCompany.value = opp.company;
          if (opp.location) inputLocation.value = opp.location;
          if (opp.salary) inputSalary.value = opp.salary;
        } else {
          showPasteFeedback(
            res?.data?.error || "Parsing failed. Please ensure the text includes role and company.",
            "error"
          );
        }
      }
    );
  });

  function showPasteFeedback(text, type) {
    if (pasteImportFeedback) {
      pasteImportFeedback.textContent = text;
      pasteImportFeedback.className = `import-feedback ${type}`;
    }
  }

  // ─── 1-Click Import Handler (Active Tab) ───

  btnImportJob.addEventListener("click", async () => {
    const title = inputTitle.value.trim();
    const company = inputCompany.value.trim();

    btnImportJob.disabled = true;
    showFeedback("Parsing and saving to HireCompass...", "");

    const payload = {
      ...(currentJob || {}),
      title: title || undefined,
      company: company || undefined,
      location: inputLocation.value.trim() || null,
      salary: inputSalary.value.trim() || null,
      status: selectStatus.value,
      rawText: currentJob?.rawText || undefined,
    };

    chrome.runtime.sendMessage(
      {
        action: "API_CALL",
        endpoint: "/api/extension/import",
        method: "POST",
        body: payload,
      },
      (res) => {
        btnImportJob.disabled = false;
        if (res && res.ok && res.data) {
          const opp = res.data.opportunity || {};
          if (opp.title && !inputTitle.value) inputTitle.value = opp.title;
          if (opp.company && !inputCompany.value) inputCompany.value = opp.company;

          const msg = res.data.isDuplicate
            ? res.data.message
            : res.data.message || "Successfully imported to HireCompass";
          showFeedback(msg, "success");
          chrome.runtime.sendMessage({ action: "REFRESH_BADGE" });
        } else {
          showFeedback(res?.data?.error || "Import failed. Check connection/login.", "error");
        }
      }
    );
  });

  function showFeedback(text, type) {
    importFeedback.textContent = text;
    importFeedback.className = `import-feedback ${type}`;
  }

  // ─── Match Score & Skill Gap ───

  btnRunMatch.addEventListener("click", async () => {
    const title = inputTitle.value.trim();
    const company = inputCompany.value.trim();
    const description = currentJob?.description || `${title} at ${company}`;

    btnRunMatch.disabled = true;
    btnRunMatch.textContent = "Analyzing...";
    matchResultContainer.style.display = "none";

    chrome.runtime.sendMessage(
      {
        action: "API_CALL",
        endpoint: "/api/extension/match",
        method: "POST",
        body: {
          jobTitle: title,
          company,
          description,
        },
      },
      (res) => {
        btnRunMatch.disabled = false;
        btnRunMatch.textContent = "Re-analyze";

        if (res && res.ok && res.data) {
          const data = res.data;
          matchScoreNum.textContent = `${data.matchScore}%`;
          matchScoreFill.style.width = `${data.matchScore}%`;

          matchedSkillsPills.innerHTML = (data.matchedSkills || [])
            .map((s) => `<span class="pill pill-matched">${escapeHtml(s)}</span>`)
            .join("");

          missingSkillsPills.innerHTML = (data.missingSkills || [])
            .map((s) => `<span class="pill pill-missing">${escapeHtml(s)}</span>`)
            .join("");

          matchAdviceBox.textContent = data.strategicAdvice || "Tailor your application to stand out.";
          matchResultContainer.style.display = "flex";
        } else {
          alert("Could not calculate match. Make sure you are logged into HireCompass.");
        }
      }
    );
  });

  // ─── Interview Prep Drill Questions ───

  btnPrepQuestions.addEventListener("click", () => {
    const isVisible = prepQuestionsList.style.display !== "none";
    if (isVisible) {
      prepQuestionsList.style.display = "none";
      return;
    }

    const title = inputTitle.value.trim() || "Software Engineer";
    const company = inputCompany.value.trim() || "Company";
    const description = currentJob?.description || "";

    prepQuestionsList.style.display = "flex";
    prepQuestionsList.innerHTML = `<div class="empty-state">Generating interview questions...</div>`;

    chrome.runtime.sendMessage(
      {
        action: "API_CALL",
        endpoint: "/api/extension/interview-prep",
        method: "POST",
        body: { jobTitle: title, company, description },
      },
      (res) => {
        if (res && res.ok && res.data) {
          const { technicalQuestions = [], behavioralQuestions = [] } = res.data;
          prepQuestionsList.innerHTML = [
            ...technicalQuestions.map(
              (q, i) => `
              <div class="prep-item">
                <strong>Question ${i + 1} (${escapeHtml(q.focus)}):</strong>
                <span>${escapeHtml(q.question)}</span>
              </div>`
            ),
            ...behavioralQuestions.map(
              (q, i) => `
              <div class="prep-item">
                <strong>Behavioral ${i + 1}:</strong>
                <span>${escapeHtml(q.question)}</span>
                <span class="text-xs text-muted" style="display:block; margin-top:2px;">Tip: ${escapeHtml(q.frameworkTip)}</span>
              </div>`
            ),
          ].join("");
        } else {
          prepQuestionsList.innerHTML = `<div class="empty-state">Failed to generate questions.</div>`;
        }
      }
    );
  });

  // ─── Outreach Generator ───

  btnGenerateOutreach.addEventListener("click", () => {
    const name = outreachName.value.trim() || "there";
    const title = outreachTitle.value.trim() || "Recruiter";
    const role = outreachRole.value.trim() || "Software Engineer";

    btnGenerateOutreach.disabled = true;
    btnGenerateOutreach.textContent = "Generating Notes...";
    outreachResults.style.display = "none";

    chrome.runtime.sendMessage(
      {
        action: "API_CALL",
        endpoint: "/api/extension/outreach",
        method: "POST",
        body: {
          recruiterName: name,
          recruiterTitle: title,
          company: role.split(" at ")[1] || "the team",
          jobTitle: role.split(" at ")[0] || role,
        },
      },
      (res) => {
        btnGenerateOutreach.disabled = false;
        btnGenerateOutreach.textContent = "Generate Outreach Notes";

        if (res && res.ok && res.data) {
          outreachNoteText.textContent = res.data.connectionNote;
          outreachInmailText.textContent = `${res.data.subject}\n\n${res.data.inmail}`;
          outreachFollowupText.textContent = res.data.followUpNote;
          outreachResults.style.display = "flex";
        } else {
          alert("Failed to generate outreach. Make sure you are logged in.");
        }
      }
    );
  });

  // Copy Buttons for Outreach & Quick Chips
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        copyToClipboard(targetEl.textContent, btn);
      }
    });
  });

  document.querySelectorAll(".quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const valEl = chip.querySelector(".chip-val");
      if (valEl && valEl.textContent !== "—") {
        copyToClipboard(valEl.textContent, chip);
      }
    });
  });

  // ─── Planner Mini Timer ───

  btnTimerToggle.addEventListener("click", () => {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      btnTimerLabel.textContent = "Resume Timer";
    } else {
      isTimerRunning = true;
      btnTimerLabel.textContent = "Pause Timer";
      timerInterval = setInterval(() => {
        if (timerSecondsLeft <= 1) {
          clearInterval(timerInterval);
          isTimerRunning = false;
          btnTimerLabel.textContent = "Start Timer";
          timerSecondsLeft = 0;
          updateTimerDigits();
          alert("Focus session completed!");
          return;
        }
        timerSecondsLeft--;
        updateTimerDigits();
      }, 1000);
    }
  });

  btnTaskDone.addEventListener("click", () => {
    if (appState && appState.activeTask) {
      btnTaskDone.disabled = true;
      btnTaskDone.textContent = "Marking...";
      // Call status refresh after finishing
      setTimeout(() => {
        btnTaskDone.textContent = "Completed";
        plannerTaskTitle.textContent = "Task completed";
        clearInterval(timerInterval);
        isTimerRunning = false;
        btnTimerLabel.textContent = "Start Timer";
      }, 600);
    }
  });

  function updateTimerDigits() {
    const mins = Math.floor(timerSecondsLeft / 60);
    const secs = timerSecondsLeft % 60;
    miniTimerDigits.textContent = `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  }

  // ─── Helpers ───

  function copyToClipboard(text, triggerEl) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = triggerEl.textContent;
      triggerEl.textContent = "Copied!";
      triggerEl.style.color = "#10b981";
      setTimeout(() => {
        triggerEl.textContent = originalText;
        triggerEl.style.color = "";
      }, 1500);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;");
  }

  // Initial load
  fetchStatus();
  extractActiveTab();
});
