(function () {
  "use strict";

  var state = {
    lang: "en",
    siteData: null,
    i18nData: null,
    repoStats: {},
    activeEventFilter: "all",
    activeCategoryFilter: "all"
  };

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      /* Ignore storage restrictions */
    }
  }

  function isTodoOrEmpty(val) {
    if (!val) return true;
    if (typeof val === "string") {
      var trimmed = val.trim();
      return trimmed === "" || trimmed.toUpperCase() === "TODO";
    }
    if (typeof val === "object") {
      var enVal = val.en ? String(val.en).trim() : "";
      var viVal = val.vi ? String(val.vi).trim() : "";
      return (
        (enVal === "" || enVal.toUpperCase() === "TODO") &&
        (viVal === "" || viVal.toUpperCase() === "TODO")
      );
    }
    return true;
  }

  function getText(obj, lang) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.en || "";
  }

  function assembleEmail(links) {
    if (!links || !links.emailUser || !links.emailDomain) return "";
    return links.emailUser + "@" + links.emailDomain;
  }

  function createSvgIcon(name) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    var paths = [];
    if (name === "github") {
      paths = [
        "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",
        "M9 18c-4.51 2-5-2-7-2"
      ];
    } else if (name === "external") {
      paths = [
        "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
        "M15 3h6v6",
        "M10 14 21 3"
      ];
    } else if (name === "mail") {
      paths = [
        "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
        "m22 6-10 7L2 6"
      ];
    } else if (name === "star") {
      paths = [
        "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      ];
    } else if (name === "code") {
      paths = ["m16 18 6-6-6-6", "m8 6-6 6 6 6"];
    } else if (name === "layers") {
      paths = [
        "m12 2 10 5-10 5-10-5 10-5Z",
        "m2 12 10 5 10-5",
        "m2 17 10 5 10-5"
      ];
    } else if (name === "database") {
      paths = [
        "M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3Z",
        "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5",
        "M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"
      ];
    } else if (name === "terminal") {
      paths = ["m4 17 6-6-6-6", "M12 19h8"];
    }

    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", paths[i]);
      svg.appendChild(p);
    }
    return svg;
  }

  function updateStaticTranslations() {
    if (!state.i18nData) return;
    var dict = state.i18nData[state.lang] || state.i18nData.en;
    if (!dict) return;

    document.title = dict.metaTitle;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", dict.metaDescription);
    }

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var keyPath = el.getAttribute("data-i18n").split(".");
      var val = dict;
      for (var k = 0; k < keyPath.length; k++) {
        if (val && typeof val === "object") {
          val = val[keyPath[k]];
        } else {
          val = null;
        }
      }
      if (typeof val === "string") {
        el.textContent = val;
      }
    }

    var ariaNodes = document.querySelectorAll("[data-i18n-aria]");
    for (var j = 0; j < ariaNodes.length; j++) {
      var ariaEl = ariaNodes[j];
      var ariaPath = ariaEl.getAttribute("data-i18n-aria").split(".");
      var ariaVal = dict;
      for (var m = 0; m < ariaPath.length; m++) {
        if (ariaVal && typeof ariaVal === "object") {
          ariaVal = ariaVal[ariaPath[m]];
        } else {
          ariaVal = null;
        }
      }
      if (typeof ariaVal === "string") {
        ariaEl.setAttribute("aria-label", ariaVal);
      }
    }

    var langBtnLabel = document.getElementById("lang-toggle-label");
    if (langBtnLabel) {
      langBtnLabel.textContent = state.lang.toUpperCase();
    }

    updateEffectsToggleLabel();
  }

  function updateEffectsToggleLabel() {
    var effBtn = document.getElementById("effects-toggle");
    if (!effBtn || !state.i18nData) return;
    var fDict = (state.i18nData[state.lang] || state.i18nData.en).footer;
    if (!fDict) return;
    var isOn =
      window.PHS_EFFECTS && window.PHS_EFFECTS.getLevel() !== "off";
    effBtn.textContent = isOn ? fDict.effectsOn : fDict.effectsOff;
    effBtn.setAttribute("aria-pressed", String(Boolean(isOn)));
  }

  function renderProfileAndLinks() {
    if (!state.siteData) return;
    var profile = state.siteData.profile || {};
    var links = state.siteData.links || {};

    var nameEl = document.getElementById("hero-name");
    if (nameEl && profile.name) {
      nameEl.textContent = profile.name;
    }

    var bioEl = document.getElementById("hero-bio");
    if (bioEl && profile.bio) {
      bioEl.textContent = getText(profile.bio, state.lang);
    }

    /* Optional LinkedIn in Utility Bar */
    var linkedinWrap = document.getElementById("utility-linkedin");
    if (linkedinWrap) {
      if (links.linkedin && String(links.linkedin).trim() !== "") {
        linkedinWrap.setAttribute("href", String(links.linkedin).trim());
        linkedinWrap.hidden = false;
      } else {
        linkedinWrap.hidden = true;
      }
    }

    /* Assemble Email & Wire Mailto Links */
    var email = assembleEmail(links);
    if (email) {
      var emailTextNodes = document.querySelectorAll("[data-email-text]");
      for (var i = 0; i < emailTextNodes.length; i++) {
        emailTextNodes[i].textContent = email;
      }

      var mailtoLinks = document.querySelectorAll("[data-mailto-link]");
      for (var m = 0; m < mailtoLinks.length; m++) {
        mailtoLinks[m].setAttribute("href", "mailto:" + email);
      }
    }

    if (links.github) {
      var ghLinks = document.querySelectorAll("[data-github-link]");
      for (var g = 0; g < ghLinks.length; g++) {
        ghLinks[g].setAttribute("href", links.github);
      }
    }
  }

  function renderProjects() {
    var container = document.getElementById("projects-grid");
    if (!container || !state.siteData || !state.i18nData) return;

    var dict = (state.i18nData[state.lang] || state.i18nData.en).projects;
    var email = assembleEmail(state.siteData.links);
    var projects = (state.siteData.projects || []).slice().sort(function (a, b) {
      return (a.priority || 99) - (b.priority || 99);
    });

    var countBadge = document.getElementById("projects-count-badge");
    if (countBadge) {
      countBadge.setAttribute("data-count", String(projects.length));
      if (countBadge.getAttribute("data-counted") === "1") {
        countBadge.textContent = String(projects.length);
      }
    }

    container.textContent = "";

    for (var i = 0; i < projects.length; i++) {
      var proj = projects[i];
      var article = document.createElement("article");
      article.className = "project-card";

      /* Header */
      var header = document.createElement("div");
      header.className = "project-header";

      var titleWrap = document.createElement("div");
      var h3 = document.createElement("h3");
      h3.className = "project-title";
      h3.textContent = proj.name;

      var tagline = document.createElement("p");
      tagline.className = "project-tagline";
      tagline.textContent = getText(proj.tagline, state.lang);

      titleWrap.appendChild(h3);
      titleWrap.appendChild(tagline);

      var badgesWrap = document.createElement("div");
      badgesWrap.className = "project-meta-badges";

      if (proj.isClientProject && proj.clientBadge) {
        var clientPill = document.createElement("span");
        clientPill.className = "meta-pill meta-pill-client";
        clientPill.textContent = getText(proj.clientBadge, state.lang);
        badgesWrap.appendChild(clientPill);
      }

      if (proj.githubRepo && state.repoStats[proj.githubRepo]) {
        var stats = state.repoStats[proj.githubRepo];
        if (stats.language) {
          var langPill = document.createElement("span");
          langPill.className = "meta-pill";
          langPill.textContent = stats.language;
          badgesWrap.appendChild(langPill);
        }
        if (typeof stats.stars === "number") {
          var starPill = document.createElement("span");
          starPill.className = "meta-pill";
          starPill.appendChild(createSvgIcon("star"));
          var starNum = document.createElement("span");
          starNum.textContent = String(stats.stars);
          starPill.appendChild(starNum);
          badgesWrap.appendChild(starPill);
        }
      }

      header.appendChild(titleWrap);
      header.appendChild(badgesWrap);
      article.appendChild(header);

      /* Tech Tags */
      var tagsUl = document.createElement("ul");
      tagsUl.className = "tech-tags";
      tagsUl.setAttribute("aria-label", "Technologies");
      for (var t = 0; t < proj.tech.length; t++) {
        var tagLi = document.createElement("li");
        tagLi.className = "tech-tag";
        tagLi.textContent = proj.tech[t];
        tagsUl.appendChild(tagLi);
      }
      article.appendChild(tagsUl);

      /* 3 Bullet Points */
      var bulletsUl = document.createElement("ul");
      bulletsUl.className = "project-bullets";
      var bullets = getText(proj.bullets, state.lang) || [];
      for (var b = 0; b < bullets.length; b++) {
        var bLi = document.createElement("li");
        bLi.textContent = bullets[b];
        bulletsUl.appendChild(bLi);
      }
      article.appendChild(bulletsUl);

      /* Links Row */
      var actions = document.createElement("div");
      actions.className = "project-actions";

      if (proj.isClientProject) {
        var demoMail = document.createElement("a");
        demoMail.className = "btn-outline";
        var subject = encodeURIComponent("Demo Request: " + proj.name);
        demoMail.setAttribute(
          "href",
          email ? "mailto:" + email + "?subject=" + subject : "#contact"
        );
        demoMail.appendChild(createSvgIcon("mail"));
        var mailSpan = document.createElement("span");
        mailSpan.textContent = getText(proj.clientCta, state.lang);
        demoMail.appendChild(mailSpan);
        actions.appendChild(demoMail);
      } else {
        if (proj.repoUrl) {
          var repoLink = document.createElement("a");
          repoLink.className = "btn-outline";
          repoLink.setAttribute("href", proj.repoUrl);
          repoLink.setAttribute("target", "_blank");
          repoLink.setAttribute("rel", "noopener noreferrer");
          repoLink.appendChild(createSvgIcon("github"));
          var repoSpan = document.createElement("span");
          repoSpan.textContent = dict.repoBtn;
          repoLink.appendChild(repoSpan);
          actions.appendChild(repoLink);
        }
        if (!isTodoOrEmpty(proj.demoUrl)) {
          var demoLink = document.createElement("a");
          demoLink.className = "btn-pill btn-pill-sm";
          demoLink.setAttribute("href", proj.demoUrl);
          demoLink.setAttribute("target", "_blank");
          demoLink.setAttribute("rel", "noopener noreferrer");
          demoLink.appendChild(createSvgIcon("external"));
          var demoSpan = document.createElement("span");
          demoSpan.textContent = dict.demoBtn;
          demoLink.appendChild(demoSpan);
          actions.appendChild(demoLink);
        }
      }
      article.appendChild(actions);

      /* Native <details><summary>View case study</summary></details> */
      if (proj.caseStudy) {
        var cs = proj.caseStudy;
        var csFields = [
          { key: "problem", label: dict.csProblem, val: cs.problem },
          { key: "approach", label: dict.csApproach, val: cs.approach },
          { key: "keyDecisions", label: dict.csDecisions, val: cs.keyDecisions },
          { key: "result", label: dict.csResult, val: cs.result },
          { key: "learned", label: dict.csLearned, val: cs.learned }
        ];

        var visibleFields = [];
        for (var f = 0; f < csFields.length; f++) {
          if (!isTodoOrEmpty(csFields[f].val)) {
            visibleFields.push(csFields[f]);
          }
        }

        if (visibleFields.length > 0) {
          var detailsEl = document.createElement("details");
          detailsEl.className = "case-study";

          var summaryEl = document.createElement("summary");
          summaryEl.textContent = dict.viewCaseStudy;
          detailsEl.appendChild(summaryEl);

          var csBody = document.createElement("div");
          csBody.className = "case-study-body";

          for (var v = 0; v < visibleFields.length; v++) {
            var block = document.createElement("div");
            block.className = "case-study-block";

            var h4 = document.createElement("h4");
            h4.textContent = visibleFields[v].label;

            var p = document.createElement("p");
            p.textContent = getText(visibleFields[v].val, state.lang);

            block.appendChild(h4);
            block.appendChild(p);
            csBody.appendChild(block);
          }

          detailsEl.appendChild(csBody);
          article.appendChild(detailsEl);
        }
      }

      container.appendChild(article);
    }
  }

  function getWriteupCountsByEvent(writeups) {
    var counts = {};
    for (var i = 0; i < writeups.length; i++) {
      var evId = writeups[i].eventId;
      counts[evId] = (counts[evId] || 0) + 1;
    }
    return counts;
  }

  function renderWriteupFilters() {
    var eventBar = document.getElementById("writeup-event-filters");
    var catBar = document.getElementById("writeup-category-filters");
    if (!eventBar || !catBar || !state.siteData || !state.i18nData) return;

    var dict = (state.i18nData[state.lang] || state.i18nData.en).writeups;
    var writeups = state.siteData.writeups || [];
    var eventCounts = getWriteupCountsByEvent(writeups);

    /* Unique events preserving order */
    var events = [];
    var seenEvents = {};
    for (var i = 0; i < writeups.length; i++) {
      var w = writeups[i];
      if (!seenEvents[w.eventId]) {
        seenEvents[w.eventId] = true;
        events.push({ id: w.eventId, name: w.eventName, count: eventCounts[w.eventId] });
      }
    }

    eventBar.textContent = "";
    var allEvBtn = document.createElement("button");
    allEvBtn.type = "button";
    allEvBtn.className = "filter-btn" + (state.activeEventFilter === "all" ? " is-active" : "");
    allEvBtn.textContent = dict.allEvents;
    var allCountSpan = document.createElement("span");
    allCountSpan.className = "filter-count";
    allCountSpan.setAttribute("data-count", String(writeups.length));
    allCountSpan.setAttribute("data-count-prefix", "(");
    allCountSpan.setAttribute("data-count-suffix", ")");
    allCountSpan.textContent = "(" + writeups.length + ")";
    allEvBtn.appendChild(allCountSpan);
    allEvBtn.addEventListener("click", function () {
      state.activeEventFilter = "all";
      renderWriteupFilters();
      renderWriteupsList();
      if (window.PHS_EFFECTS) window.PHS_EFFECTS.refresh(false);
    });
    eventBar.appendChild(allEvBtn);

    for (var e = 0; e < events.length; e++) {
      (function (ev) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-btn" + (state.activeEventFilter === ev.id ? " is-active" : "");
        btn.textContent = ev.name;

        var countSpan = document.createElement("span");
        countSpan.className = "filter-count";
        countSpan.setAttribute("data-count", String(ev.count));
        countSpan.setAttribute("data-count-prefix", "(");
        countSpan.setAttribute("data-count-suffix", ")");
        countSpan.textContent = "(" + ev.count + ")";
        btn.appendChild(countSpan);

        btn.addEventListener("click", function () {
          state.activeEventFilter = ev.id;
          renderWriteupFilters();
          renderWriteupsList();
          if (window.PHS_EFFECTS) window.PHS_EFFECTS.refresh(false);
        });
        eventBar.appendChild(btn);
      })(events[e]);
    }

    /* Unique filter groups */
    var categories = [];
    var seenCats = {};
    for (var c = 0; c < writeups.length; c++) {
      var grp = writeups[c].filterGroup || writeups[c].category;
      if (!seenCats[grp]) {
        seenCats[grp] = true;
        categories.push(grp);
      }
    }

    catBar.textContent = "";
    var allCatBtn = document.createElement("button");
    allCatBtn.type = "button";
    allCatBtn.className = "filter-btn" + (state.activeCategoryFilter === "all" ? " is-active" : "");
    allCatBtn.textContent = dict.allCategories;
    allCatBtn.addEventListener("click", function () {
      state.activeCategoryFilter = "all";
      renderWriteupFilters();
      renderWriteupsList();
      if (window.PHS_EFFECTS) window.PHS_EFFECTS.refresh(false);
    });
    catBar.appendChild(allCatBtn);

    for (var k = 0; k < categories.length; k++) {
      (function (catName) {
        var cBtn = document.createElement("button");
        cBtn.type = "button";
        cBtn.className = "filter-btn" + (state.activeCategoryFilter === catName ? " is-active" : "");
        cBtn.textContent = catName;
        cBtn.addEventListener("click", function () {
          state.activeCategoryFilter = catName;
          renderWriteupFilters();
          renderWriteupsList();
          if (window.PHS_EFFECTS) window.PHS_EFFECTS.refresh(false);
        });
        catBar.appendChild(cBtn);
      })(categories[k]);
    }
  }

  function renderWriteupsList() {
    var listEl = document.getElementById("writeups-list");
    if (!listEl || !state.siteData || !state.i18nData) return;

    var dict = (state.i18nData[state.lang] || state.i18nData.en).writeups;
    var writeups = state.siteData.writeups || [];

    listEl.textContent = "";

    for (var i = 0; i < writeups.length; i++) {
      var item = writeups[i];
      if (state.activeEventFilter !== "all" && item.eventId !== state.activeEventFilter) {
        continue;
      }
      var grp = item.filterGroup || item.category;
      if (state.activeCategoryFilter !== "all" && grp !== state.activeCategoryFilter) {
        continue;
      }

      var article = document.createElement("article");
      article.className = "writeup-card";

      var top = document.createElement("div");
      top.className = "writeup-top";

      var badges = document.createElement("div");
      badges.className = "writeup-badges";

      var evBadge = document.createElement("span");
      evBadge.className = "badge-event";
      evBadge.textContent = item.eventName;
      badges.appendChild(evBadge);

      var catBadge = document.createElement("span");
      catBadge.className = "badge-category";
      var catText = item.category;
      if (!isTodoOrEmpty(item.points)) {
        catText += " · " + item.points;
      }
      if (!isTodoOrEmpty(item.difficulty)) {
        catText += " · " + item.difficulty;
      }
      catBadge.textContent = catText;
      badges.appendChild(catBadge);

      if (!isTodoOrEmpty(item.date)) {
        var dateBadge = document.createElement("span");
        dateBadge.className = "badge-category";
        dateBadge.textContent = item.date;
        badges.appendChild(dateBadge);
      }

      var langBadge = document.createElement("span");
      langBadge.className = "badge-lang";
      langBadge.textContent = item.langBadge || "EN";

      top.appendChild(badges);
      top.appendChild(langBadge);
      article.appendChild(top);

      var h3 = document.createElement("h3");
      h3.className = "writeup-title";
      h3.textContent = item.title;
      article.appendChild(h3);

      var summary = document.createElement("p");
      summary.className = "writeup-summary";
      summary.textContent = getText(item.summary, state.lang);
      article.appendChild(summary);

      var bottom = document.createElement("div");
      bottom.className = "writeup-bottom";

      var toolsUl = document.createElement("ul");
      toolsUl.className = "tech-tags";
      toolsUl.setAttribute("aria-label", "Tools");
      for (var t = 0; t < (item.tools || []).length; t++) {
        var tLi = document.createElement("li");
        tLi.className = "tech-tag";
        tLi.textContent = item.tools[t];
        toolsUl.appendChild(tLi);
      }

      var readLink = document.createElement("a");
      readLink.className = "link-arrow";
      readLink.setAttribute("href", item.url);
      readLink.setAttribute("target", "_blank");
      readLink.setAttribute("rel", "noopener noreferrer");
      readLink.textContent = dict.readWriteup;

      bottom.appendChild(toolsUl);
      bottom.appendChild(readLink);
      article.appendChild(bottom);

      listEl.appendChild(article);
    }
  }

  function renderContests() {
    var container = document.getElementById("contests-timeline");
    if (!container || !state.siteData || !state.i18nData) return;

    var contests = state.siteData.contests || [];
    var writeups = state.siteData.writeups || [];
    var countsByEvent = getWriteupCountsByEvent(writeups);
    var dict = (state.i18nData[state.lang] || state.i18nData.en).contests;

    container.textContent = "";

    for (var i = 0; i < contests.length; i++) {
      var item = contests[i];
      var li = document.createElement("li");
      li.className = "timeline-item";

      var dot = document.createElement("span");
      dot.className = "timeline-dot";
      dot.setAttribute("aria-hidden", "true");
      li.appendChild(dot);

      var head = document.createElement("div");
      head.className = "timeline-head";

      var h3 = document.createElement("h3");
      h3.className = "timeline-title";
      h3.textContent = getText(item.name, state.lang);

      var years = document.createElement("span");
      years.className = "timeline-years";
      years.textContent = item.period;

      head.appendChild(h3);
      head.appendChild(years);
      li.appendChild(head);

      if (item.description) {
        var desc = document.createElement("p");
        desc.className = "timeline-desc";
        desc.textContent = getText(item.description, state.lang);
        li.appendChild(desc);
      }

      /* Dynamic writeup count + jump link to filtered Writeups section */
      if (item.writeupEventId && countsByEvent[item.writeupEventId]) {
        var count = countsByEvent[item.writeupEventId];
        var suffix = getText(item.writeupLabelSuffix, state.lang);
        var wLink = document.createElement("a");
        wLink.className = "timeline-writeup-link";
        wLink.setAttribute("href", "#writeups");

        var numSpan = document.createElement("span");
        numSpan.setAttribute("data-count", String(count));
        numSpan.textContent = String(count);
        wLink.appendChild(numSpan);
        wLink.appendChild(document.createTextNode(" " + suffix + " →"));

        (function (evId) {
          wLink.addEventListener("click", function () {
            state.activeEventFilter = evId;
            state.activeCategoryFilter = "all";
            renderWriteupFilters();
            renderWriteupsList();
            if (window.PHS_EFFECTS) window.PHS_EFFECTS.refresh(false);
          });
        })(item.writeupEventId);

        li.appendChild(wLink);
      }

      /* Expandable Hackathon Project (<details>) if present */
      if (item.project) {
        var pInfo = item.project;
        var pDetails = document.createElement("details");
        pDetails.className = "case-study contest-project-details";

        var pSummary = document.createElement("summary");
        pSummary.textContent = dict.viewProject || "View hackathon project & case study";
        pDetails.appendChild(pSummary);

        var pBody = document.createElement("div");
        pBody.className = "contest-project-body";

        var pHeader = document.createElement("div");
        pHeader.className = "contest-project-header";

        var pTitle = document.createElement("h4");
        pTitle.className = "contest-project-title";
        pTitle.textContent = pInfo.name;
        pHeader.appendChild(pTitle);

        if (pInfo.category) {
          var pCat = document.createElement("p");
          pCat.className = "contest-project-category";
          pCat.textContent = getText(pInfo.category, state.lang);
          pHeader.appendChild(pCat);
        }
        pBody.appendChild(pHeader);

        if (pInfo.summary) {
          var pSumm = document.createElement("p");
          pSumm.className = "contest-project-summary";
          pSumm.textContent = getText(pInfo.summary, state.lang);
          pBody.appendChild(pSumm);
        }

        if (pInfo.limitations && !isTodoOrEmpty(pInfo.limitations)) {
          var pLimit = document.createElement("div");
          pLimit.className = "contest-project-limitations";
          var lLabel = document.createElement("strong");
          lLabel.textContent = (dict.limitationsLabel || "Limitations:") + " ";
          var lText = document.createElement("span");
          lText.textContent = getText(pInfo.limitations, state.lang);
          pLimit.appendChild(lLabel);
          pLimit.appendChild(lText);
          pBody.appendChild(pLimit);
        }

        if (pInfo.tech && pInfo.tech.length > 0) {
          var pTechUl = document.createElement("ul");
          pTechUl.className = "tech-tags";
          pTechUl.setAttribute("aria-label", "Hackathon Technologies");
          for (var pt = 0; pt < pInfo.tech.length; pt++) {
            var ptLi = document.createElement("li");
            ptLi.className = "tech-tag";
            ptLi.textContent = pInfo.tech[pt];
            pTechUl.appendChild(ptLi);
          }
          pBody.appendChild(pTechUl);
        }

        /* Project Links: Event page, Repo, Demo video */
        var pActions = document.createElement("div");
        pActions.className = "project-actions";

        if (pInfo.eventUrl) {
          var evBtn = document.createElement("a");
          evBtn.className = "btn-outline";
          evBtn.setAttribute("href", pInfo.eventUrl);
          evBtn.setAttribute("target", "_blank");
          evBtn.setAttribute("rel", "noopener noreferrer");
          evBtn.appendChild(createSvgIcon("external"));
          var evSpan = document.createElement("span");
          evSpan.textContent = dict.eventPageBtn || "Event page";
          evBtn.appendChild(evSpan);
          pActions.appendChild(evBtn);
        }

        if (pInfo.repoPublished) {
          if (pInfo.repoUrl) {
            var rBtn = document.createElement("a");
            rBtn.className = "btn-outline";
            rBtn.setAttribute("href", pInfo.repoUrl);
            rBtn.setAttribute("target", "_blank");
            rBtn.setAttribute("rel", "noopener noreferrer");
            rBtn.appendChild(createSvgIcon("github"));
            var rSpan = document.createElement("span");
            rSpan.textContent = dict.repoBtn || "Repo";
            rBtn.appendChild(rSpan);
            pActions.appendChild(rBtn);
          }
          if (pInfo.demoVideoUrl) {
            var vBtn = document.createElement("a");
            vBtn.className = "btn-pill btn-pill-sm";
            vBtn.setAttribute("href", pInfo.demoVideoUrl);
            vBtn.setAttribute("target", "_blank");
            vBtn.setAttribute("rel", "noopener noreferrer");
            vBtn.appendChild(createSvgIcon("external"));
            var vSpan = document.createElement("span");
            vSpan.textContent = dict.videoBtn || "Demo video";
            vBtn.appendChild(vSpan);
            pActions.appendChild(vBtn);
          }
        }
        pBody.appendChild(pActions);

        /* Case study breakdown (5 standard fields) */
        if (pInfo.caseStudy) {
          var csP = pInfo.caseStudy;
          var csDict = (state.i18nData[state.lang] || state.i18nData.en).projects;
          var csPFields = [
            { key: "problem", label: csDict.csProblem, val: csP.problem },
            { key: "approach", label: csDict.csApproach, val: csP.approach },
            { key: "keyDecisions", label: csDict.csDecisions, val: csP.keyDecisions },
            { key: "result", label: csDict.csResult, val: csP.result },
            { key: "learned", label: csDict.csLearned, val: csP.learned }
          ];

          var visPFields = [];
          for (var pf = 0; pf < csPFields.length; pf++) {
            if (!isTodoOrEmpty(csPFields[pf].val)) {
              visPFields.push(csPFields[pf]);
            }
          }

          if (visPFields.length > 0) {
            var csPGrid = document.createElement("div");
            csPGrid.className = "case-study-body";
            for (var vf = 0; vf < visPFields.length; vf++) {
              var cBlock = document.createElement("div");
              cBlock.className = "case-study-block";
              var ch4 = document.createElement("h4");
              ch4.textContent = visPFields[vf].label;
              var cp = document.createElement("p");
              cp.textContent = getText(visPFields[vf].val, state.lang);
              cBlock.appendChild(ch4);
              cBlock.appendChild(cp);
              csPGrid.appendChild(cBlock);
            }
            pBody.appendChild(csPGrid);
          }
        }

        pDetails.appendChild(pBody);
        li.appendChild(pDetails);
      }

      /* Hide result if "TODO" or empty */
      if (!isTodoOrEmpty(item.result)) {
        var resP = document.createElement("p");
        resP.className = "timeline-writeup-link";
        resP.textContent = dict.resultLabel + " " + getText(item.result, state.lang);
        li.appendChild(resP);
      }

      container.appendChild(li);
    }
  }

  function renderStack() {
    var container = document.getElementById("stack-grid");
    if (!container || !state.siteData) return;

    var stack = state.siteData.stack || [];
    container.textContent = "";

    for (var i = 0; i < stack.length; i++) {
      var group = stack[i];
      var card = document.createElement("div");
      card.className = "speciality-card";

      var iconBox = document.createElement("div");
      iconBox.className = "speciality-icon";
      iconBox.setAttribute("aria-hidden", "true");
      iconBox.appendChild(createSvgIcon(group.icon || "code"));
      card.appendChild(iconBox);

      var h3 = document.createElement("h3");
      h3.className = "speciality-title";
      h3.textContent = getText(group.title, state.lang);
      card.appendChild(h3);

      var ul = document.createElement("ul");
      ul.className = "tech-tags";
      for (var j = 0; j < group.items.length; j++) {
        var li = document.createElement("li");
        li.className = "tech-tag";
        li.textContent = group.items[j];
        ul.appendChild(li);
      }
      card.appendChild(ul);
      container.appendChild(card);
    }
  }

  function renderAll() {
    updateStaticTranslations();
    renderProfileAndLinks();
    renderProjects();
    renderWriteupFilters();
    renderWriteupsList();
    renderContests();
    renderStack();
    if (window.PHS_EFFECTS) {
      window.PHS_EFFECTS.refresh(true);
    }
  }

  function fetchRepoMetadata() {
    if (!state.siteData || !state.siteData.projects) return;
    var projects = state.siteData.projects;

    for (var i = 0; i < projects.length; i++) {
      (function (proj) {
        if (!proj.githubRepo) return;
        var cacheKey = "gh_repo_" + proj.githubRepo;
        try {
          var cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            state.repoStats[proj.githubRepo] = JSON.parse(cached);
            renderProjects();
            return;
          }
        } catch (err) {
          /* Ignore sessionStorage restrictions */
        }

        fetch("https://api.github.com/repos/" + proj.githubRepo, {
          headers: { Accept: "application/vnd.github.v3+json" }
        })
          .then(function (res) {
            if (!res.ok) return null;
            return res.json();
          })
          .then(function (data) {
            if (!data) return;
            var meta = {
              language: data.language || null,
              stars:
                typeof data.stargazers_count === "number"
                  ? data.stargazers_count
                  : null
            };
            state.repoStats[proj.githubRepo] = meta;
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(meta));
            } catch (err) {
              /* Ignore quota error */
            }
            renderProjects();
          })
          .catch(function () {
            /* Silent fallback on rate-limit or network offline */
          });
      })(projects[i]);
    }
  }

  function setupInteractions() {
    /* Language Switcher */
    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.addEventListener("click", function () {
        state.lang = state.lang === "en" ? "vi" : "en";
        document.documentElement.setAttribute("lang", state.lang);
        safeStorageSet("phs_lang", state.lang);
        renderAll();
      });
    }

    /* Effects Toggle Button in Footer */
    var effBtn = document.getElementById("effects-toggle");
    if (effBtn) {
      effBtn.addEventListener("click", function () {
        if (window.PHS_EFFECTS) {
          window.PHS_EFFECTS.toggle();
          updateEffectsToggleLabel();
        }
      });
    }

    /* Mobile Hamburger Menu */
    var menuToggle = document.getElementById("menu-toggle");
    var navMenu = document.getElementById("nav-menu");
    if (menuToggle && navMenu) {
      menuToggle.addEventListener("click", function () {
        var expanded = menuToggle.getAttribute("aria-expanded") === "true";
        var next = !expanded;
        menuToggle.setAttribute("aria-expanded", String(next));
        navMenu.classList.toggle("is-open", next);
      });

      var links = navMenu.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function () {
          menuToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("is-open");
        });
      }

      document.addEventListener("keydown", function (e) {
        if (
          e.key === "Escape" &&
          menuToggle.getAttribute("aria-expanded") === "true"
        ) {
          menuToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("is-open");
          menuToggle.focus();
        }
      });
    }

    /* Copy Email Button */
    var copyBtns = document.querySelectorAll("[data-copy-email]");
    var copyStatus = document.getElementById("copy-status");
    for (var c = 0; c < copyBtns.length; c++) {
      copyBtns[c].addEventListener("click", function () {
        if (!state.siteData) return;
        var email = assembleEmail(state.siteData.links);
        if (!email) return;

        var showCopied = function () {
          if (!copyStatus || !state.i18nData) return;
          var dict = (state.i18nData[state.lang] || state.i18nData.en).footer;
          copyStatus.textContent = dict.copied;
          setTimeout(function () {
            copyStatus.textContent = "";
          }, 2200);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(email)
            .then(showCopied)
            .catch(function () {});
        } else {
          var ta = document.createElement("textarea");
          ta.value = email;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            showCopied();
          } catch (err) {
            /* Ignore */
          }
          document.body.removeChild(ta);
        }
      });
    }

    /* IntersectionObserver: Active Nav Highlight & One-time 8px Scroll Reveal */
    if ("IntersectionObserver" in window) {
      var sections = document.querySelectorAll("main section[id]");
      var navLinks = document.querySelectorAll(".nav-link");

      var navObserver = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              var id = entries[i].target.getAttribute("id");
              for (var j = 0; j < navLinks.length; j++) {
                var isMatch = navLinks[j].getAttribute("href") === "#" + id;
                navLinks[j].classList.toggle("is-active", isMatch);
              }
            }
          }
        },
        { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
      );

      for (var s = 0; s < sections.length; s++) {
        navObserver.observe(sections[s]);
      }

      var reveals = document.querySelectorAll(".reveal");
      var reduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        for (var r = 0; r < reveals.length; r++) {
          reveals[r].classList.add("is-revealed");
        }
      } else {
        var revealObserver = new IntersectionObserver(
          function (entries, obs) {
            for (var k = 0; k < entries.length; k++) {
              if (entries[k].isIntersecting) {
                entries[k].target.classList.add("is-revealed");
                obs.unobserve(entries[k].target);
              }
            }
          },
          { threshold: 0.08 }
        );

        for (var n = 0; n < reveals.length; n++) {
          revealObserver.observe(reveals[n]);
        }
      }
    } else {
      var allReveals = document.querySelectorAll(".reveal");
      for (var x = 0; x < allReveals.length; x++) {
        allReveals[x].classList.add("is-revealed");
      }
    }
  }

  function shouldSkipHero3D() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return true;
    }

    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.saveData === true) {
      return true;
    }

    /* Disable 3D by default on mobile (< 768px) to keep mobile Lighthouse Performance >= 95 */
    if (window.innerWidth < 768) {
      return true;
    }

    if (
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 4
    ) {
      return true;
    }

    try {
      var testCanvas = document.createElement("canvas");
      var gl =
        testCanvas.getContext("webgl2") ||
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) return true;
    } catch (err) {
      return true;
    }

    return false;
  }

  var hero3DDispose = null;

  function scheduleHero3D() {
    var stageEl = document.getElementById("hero-3d-stage");
    var fallbackEl = document.getElementById("hero-3d-fallback");
    var level = window.PHS_EFFECTS ? window.PHS_EFFECTS.getLevel() : "rich";

    if (hero3DDispose) {
      hero3DDispose();
      hero3DDispose = null;
    }

    if (!stageEl || level === "off" || shouldSkipHero3D()) return;

    function loadModule() {
      var runImport = function () {
        var currentLevel = window.PHS_EFFECTS
          ? window.PHS_EFFECTS.getLevel()
          : "rich";
        if (currentLevel === "off" || shouldSkipHero3D()) return;
        import("./hero3d.js")
          .then(function (mod) {
            if (mod && typeof mod.initHero3D === "function") {
              if (hero3DDispose) hero3DDispose();
              hero3DDispose = mod.initHero3D(stageEl, fallbackEl, currentLevel);
            }
          })
          .catch(function () {
            /* Keep static SVG fallback on error */
          });
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(runImport, { timeout: 1500 });
      } else {
        setTimeout(runImport, 250);
      }
    }

    if (document.readyState === "complete") {
      loadModule();
    } else {
      window.addEventListener("load", loadModule, { once: true });
    }
  }

  function init() {
    var savedLang = safeStorageGet("phs_lang");
    if (savedLang === "vi" || savedLang === "en") {
      state.lang = savedLang;
      document.documentElement.setAttribute("lang", state.lang);
    }

    setupInteractions();
    if (window.PHS_EFFECTS) {
      window.PHS_EFFECTS.configure(null, function () {
        updateEffectsToggleLabel();
        scheduleHero3D();
      });
    }
    scheduleHero3D();

    Promise.all([
      fetch("assets/data/site.json").then(function (r) {
        return r.json();
      }),
      fetch("assets/data/i18n.json").then(function (r) {
        return r.json();
      })
    ])
      .then(function (results) {
        state.siteData = results[0];
        state.i18nData = results[1];
        if (window.PHS_EFFECTS && state.siteData.effects) {
          window.PHS_EFFECTS.configure(state.siteData.effects, function () {
            updateEffectsToggleLabel();
            scheduleHero3D();
          });
        }
        renderAll();
        fetchRepoMetadata();
      })
      .catch(function () {
        /* Static HTML fallback remains visible */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
