        const state = {
            workflows: [],
            executions: [],
            flags: [],
            errors: [],
            traces: [],
            health: [],
            serviceName: "-",
            environment: "-",
            settings: null,
            aiInsight: null,
            aiInsightError: null,
            aiInsightLoading: false,
            aiModelConfigured: false,
            aiKeyMissing: false,
            apiBacked: false,
            apiError: null,
            aiMessages: [],
            groqModels: [],
            selectedGroqModel: "llama-3.3-70b-versatile"
        };

        const SEEDED_GROQ_MODELS = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "meta-llama/llama-4-maverick-17b-128e-instruct",
            "moonshotai/kimi-k2-instruct-0905",
            "qwen/qwen3-32b"
        ];

        const pageButtons = document.querySelectorAll("[data-page-button]");
        const pages = document.querySelectorAll(".page");
        const drawer = document.getElementById("detail-drawer");
        const drawerTitle = document.getElementById("drawer-title");
        const drawerSubtitle = document.getElementById("drawer-subtitle");
        const drawerBody = document.getElementById("drawer-body");
        const flagModal = document.getElementById("flag-modal");
        const globalSearchShell = document.getElementById("global-search-shell");
        const globalSearchInput = document.getElementById("global-search");
        const globalSearchResults = document.getElementById("global-search-results");

        function pinnedWorkflowNames() {
            try {
                return new Set(JSON.parse(localStorage.getItem("flowwatch:pinned-workflows") || "[]"));
            }
            catch {
                return new Set();
            }
        }

        function savePinnedWorkflowNames() {
            try {
                localStorage.setItem("flowwatch:pinned-workflows", JSON.stringify(state.workflows.filter((workflow) => workflow.pinned).map((workflow) => workflow.name)));
            }
            catch {
                // Local storage can be disabled; pinning can remain session-only.
            }
        }

        function dashboardBasePath() {
            const currentPath = window.location.pathname;

            if (currentPath.endsWith("/dashboard.html") || currentPath.endsWith("/index.html")) {
                return currentPath.slice(0, currentPath.lastIndexOf("/") + 1);
            }

            return currentPath.endsWith("/") ? currentPath : `${currentPath}/`;
        }

        function apiPath(path) {
            return `${dashboardBasePath()}api/${String(path).replace(/^\/+/, "")}`;
        }

        function escapeHtml(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        async function apiRequest(path, options = {}) {
            const response = await fetch(apiPath(path), {
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                },
                ...options,
            });

            if (!response.ok) {
                let message = `Request failed with ${response.status}`;
                let code = "";

                try {
                    const body = await response.json();
                    message = body?.error?.message || body?.message || message;
                    code = body?.error?.code || body?.code || "";
                }
                catch {
                    // Keep the status-based message when the response is not JSON.
                }

                const error = new Error(message);
                error.status = response.status;
                error.code = code;
                throw error;
            }

            if (response.status === 204) {
                return {};
            }

            return response.json();
        }

        function normalizeWorkflow(workflow, index = 0) {
            const savedPins = pinnedWorkflowNames();
            const hasSavedPins = savedPins.size > 0;
            const chain = Array.isArray(workflow.chain) ? workflow.chain : [];
            const latestExecution = workflow.latestExecution || null;

            return {
                ...workflow,
                name: workflow.name,
                version: workflow.version || workflow.workflowVersion || latestExecution?.workflowVersion || 1,
                steps: workflow.steps || chain.length || latestExecution?.steps?.length || 0,
                created: workflow.created || formatDateTime(workflow.createdAt),
                lastStatus: workflow.lastStatus || latestExecution?.status || "queued",
                failures: workflow.failures || 0,
                pinned: hasSavedPins ? savedPins.has(workflow.name) : index < 4,
                chain: chain.length ? chain : (latestExecution?.steps || []).map((step) => step.stepName || step.name),
                latestExecution,
            };
        }

        function normalizeExecution(execution) {
            return {
                ...execution,
                workflow: execution.workflow || execution.workflowName,
                started: execution.started || formatTime(execution.startedAt || execution.createdAt),
                finished: execution.finished || formatTime(execution.completedAt || execution.failedAt),
                failedStep: execution.failedStep || (execution.steps || []).find((step) => step.status === "failed")?.stepName || "-",
                attempts: execution.attempts ?? (execution.steps || []).reduce((total, step) => total + Number(step.attempts || step.attemptCount || 0), 0),
                duration: execution.duration || formatDurationLabel(execution.durationMs),
                steps: execution.steps || [],
            };
        }

        function normalizeFlag(flag) {
            return {
                ...flag,
                rollout: flag.rollout ?? flag.rolloutPercentage ?? 0,
                rules: flag.rules ?? 0,
                changedBy: flag.changedBy || "dashboard",
            };
        }

        function normalizeError(error) {
            return {
                ...error,
                name: error.name || "Error",
                status: error.status ?? error.statusCode ?? "-",
                trace: error.trace || error.traceId || "-",
                occurred: error.occurred || formatTime(error.occurredAt || error.createdAt),
            };
        }

        function normalizeTrace(trace) {
            return {
                ...trace,
                status: trace.status ?? trace.statusCode ?? "-",
                duration: trace.duration ?? trace.durationMs ?? 0,
                spans: trace.spans || [],
            };
        }

        function formatTime(value) {
            if (!value) return "-";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "-";
            return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        }

        function formatDateTime(value) {
            if (!value) return "-";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "-";
            return date.toISOString().slice(0, 16).replace("T", " ");
        }

        function formatDurationLabel(ms) {
            if (ms === null || ms === undefined) return "-";
            if (ms < 1000) return `${ms}ms`;
            return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
        }

        async function loadDashboardData() {
            try {
                const data = await apiRequest("dashboard-data");

                state.serviceName = data.serviceName || "-";
                state.environment = data.environment || "-";
                state.settings = data.settings || null;
                state.workflows = (data.workflows || []).map(normalizeWorkflow);
                state.executions = (data.executions || []).map(normalizeExecution);
                state.flags = (data.flags || []).map(normalizeFlag);
                state.errors = (data.errors || []).map(normalizeError);
                state.traces = (data.traces || []).map(normalizeTrace);
                state.health = data.health || [];
                state.apiBacked = true;
                state.apiError = null;
            }
            catch (error) {
                state.workflows = [];
                state.executions = [];
                state.flags = [];
                state.errors = [];
                state.traces = [];
                state.health = [];
                state.serviceName = "-";
                state.environment = "-";
                state.settings = null;
                state.apiBacked = false;
                state.apiError = error instanceof Error ? error.message : "Dashboard API unavailable";
            }

            renderAll();
        }

        function badgeForStatus(status) {
            const s = escapeHtml(status);
            if (status === "completed" || status === "ok") return `<span class="badge ok"><span class="dot"></span>${s}</span>`;
            if (status === "running" || status === "queued" || status === "degraded") return `<span class="badge warn"><span class="dot"></span>${s}</span>`;
            return `<span class="badge bad"><span class="dot"></span>${s}</span>`;
        }

        function graphStatusClass(status) {
            if (status === "completed" || status === "ok") return "success";
            if (status === "running" || status === "queued" || status === "degraded") return "running";
            if (status === "failed" || status === "error") return "failed";
            return "";
        }

        function tableEmptyRow(colspan, title, copy) {
            return `
                <tr>
                    <td colspan="${Number(colspan) || 1}">
                        <div class="empty-state" style="padding: 20px;">
                            <div class="empty-title">${escapeHtml(title)}</div>
                            <div class="empty-copy">${escapeHtml(copy)}</div>
                        </div>
                    </td>
                </tr>
            `;
        }

        function workflowStepStatus(workflow, step, execution) {
            if (!execution) return "pending";
            const recordedStep = (execution.steps || []).find((item) => (item.stepName || item.name) === step);
            if (recordedStep?.status) return recordedStep.status;
            if (execution.status === "failed" && execution.failedStep === step) return "failed";
            if (["running", "queued"].includes(execution.status)) {
                const index = (workflow.chain || []).indexOf(step);
                if (index === 0) return execution.status;
            }
            return "pending";
        }

        function badgeForMethod(method) {
            const m = escapeHtml(method);
            if (method === "GET") return `<span class="badge ok">${m}</span>`;
            if (method === "POST") return `<span class="badge info">${m}</span>`;
            if (method === "PATCH") return `<span class="badge warn">${m}</span>`;
            return `<span class="badge bad">${m}</span>`;
        }

        function showPage(pageName) {
            pageButtons.forEach((button) => button.classList.toggle("active", button.dataset.pageButton === pageName));
            pages.forEach((page) => page.classList.toggle("active", page.id === `page-${pageName}`));
            closeDrawer();

            if (pageName === "ai-insights") {
                loadAiInsights();
            }
            if (pageName === "ask-ai") {
                initAiChat();
            }
            if (pageName === "settings") {
                loadGroqModelsForSettings();
            }
        }

        function openDrawer(title, subtitle, html) {
            drawerTitle.textContent = title;
            drawerSubtitle.textContent = subtitle;
            drawerBody.innerHTML = html;
            drawer.classList.add("open");
            drawer.setAttribute("aria-hidden", "false");
        }

        function closeDrawer() {
            drawer.classList.remove("open");
            drawer.setAttribute("aria-hidden", "true");
            drawerBody.innerHTML = "";
        }

        function latestExecutionForWorkflow(workflowName) {
            const workflow = state.workflows.find((item) => item.name === workflowName);
            return state.executions.find((execution) => execution.workflow === workflowName) || workflow?.latestExecution;
        }

        function allExecutionsForWorkflow(workflowName) {
            return state.executions.filter((execution) => execution.workflow === workflowName);
        }

        function workflowErrorForStep(workflowName, stepName) {
            const execution = latestExecutionForWorkflow(workflowName);
            const failedStep = (execution?.steps || []).find((step) => {
                const name = step.stepName || step.name;
                return name === stepName && step.status === "failed";
            });

            if (failedStep?.error) {
                const error = typeof failedStep.error === "string" ? { message: failedStep.error } : failedStep.error;
                return {
                    name: error.name || "WorkflowStepError",
                    message: error.message || JSON.stringify(error),
                    trace: execution.traceId || execution.trace || "-",
                    source: "workflow_step",
                };
            }

            if (!execution || execution.failedStep !== stepName) {
                return undefined;
            }

            const matchingTraceError = state.errors.find((error) => error.trace !== "-" && (error.trace === execution.traceId || error.trace === execution.trace));

            if (matchingTraceError) {
                return matchingTraceError;
            }

            return state.errors.find((error) => error.source === "workflow_step") || state.errors.find((error) => error.trace !== "-");
        }

        function workflowExecutionSteps(workflow, execution) {
            if (execution?.steps?.length) {
                return execution.steps.map((step, index) => {
                    const name = step.stepName || step.name || `step-${index + 1}`;
                    const error = step.status === "failed" ? workflowErrorForStep(workflow.name, name) : undefined;

                    return {
                        name,
                        index,
                        status: step.status || "pending",
                        duration: step.duration || formatDurationLabel(step.durationMs),
                        attempts: step.attempts ?? step.attemptCount ?? 0,
                        error,
                    };
                });
            }

            return workflow.chain.map((step, index) => {
                const normalizedStatus = workflowStepStatus(workflow, step, execution);
                const error = normalizedStatus === "failed" ? workflowErrorForStep(workflow.name, step) : undefined;

                return {
                    name: step,
                    index,
                    status: normalizedStatus,
                    duration: "-",
                    attempts: normalizedStatus === "failed" ? execution?.attempts || 1 : 0,
                    error,
                };
            });
        }

        function badgeForStepStatus(status) {
            if (status === "completed") return badgeForStatus("completed");
            if (status === "running" || status === "queued" || status === "pending") return `<span class="badge warn"><span class="dot"></span>${escapeHtml(status)}</span>`;
            return badgeForStatus("failed");
        }

        function workflowStepErrorDetail(workflow, step, error) {
            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Workflow</div><div class="field-value">${escapeHtml(workflow.name)}</div></div>
                    <div class="field"><div class="field-label">Failed step</div><div class="field-value">${escapeHtml(step.name)}</div></div>
                    <div class="field"><div class="field-label">Attempts</div><div class="field-value mono">${escapeHtml(step.attempts)}</div></div>
                    <div class="field"><div class="field-label">Trace ID</div><div class="field-value mono">${escapeHtml(error?.trace || "-")}</div></div>
                </div>
                <div class="field" style="margin-bottom: 12px;"><div class="field-label">Error message</div><div class="field-value">${escapeHtml(error?.message || "No captured error is linked to this workflow step yet.")}</div></div>
                <pre class="code-box">${escapeHtml(error?.name || "WorkflowStepError")}: ${escapeHtml(error?.message || "Step failed without a captured error record.")}
    at runWorkflowStep (${escapeHtml(workflow.name)}.${escapeHtml(step.name)})
    at executeWorkflow (workflowWorker.ts)</pre>
            `;
        }

        function renderOverview() {
            const failedExecutions = state.executions.filter((execution) => execution.status === "failed");
            const runningExecutions = state.executions.filter((execution) => execution.status === "running");
            const activeFlags = state.flags.filter((flag) => flag.enabled);
            const partialFlags = state.flags.filter((flag) => flag.enabled && Number(flag.rollout) > 0 && Number(flag.rollout) < 100);
            const avgTraceDuration = state.traces.length
                ? Math.round(state.traces.reduce((total, trace) => total + Number(trace.duration || 0), 0) / state.traces.length)
                : null;
            const latestFailedExecution = failedExecutions[0];

            document.getElementById("top-service").textContent = state.serviceName;
            document.getElementById("sidebar-service").textContent = state.serviceName;
            document.getElementById("summary-workflow-count").textContent = `${state.workflows.length}`;
            document.getElementById("summary-execution-count").textContent = `${state.executions.length}`;
            document.getElementById("summary-error-count").textContent = `${state.errors.length}`;
            document.getElementById("summary-trace-count").textContent = `${state.traces.length}`;
            document.getElementById("metric-workflows").textContent = state.workflows.length;
            document.getElementById("metric-running").textContent = runningExecutions.length;
            document.getElementById("metric-failed").textContent = failedExecutions.length;
            document.getElementById("metric-errors").textContent = state.errors.length;
            document.getElementById("metric-flags").textContent = activeFlags.length;
            document.getElementById("metric-latency").textContent = avgTraceDuration === null ? "-" : `${avgTraceDuration}ms`;
            document.getElementById("metric-workflows-delta").textContent = "from flowwatch_workflows";
            document.getElementById("metric-running-delta").textContent = "currently running";
            document.getElementById("metric-failed-delta").textContent = "latest loaded executions";
            document.getElementById("metric-errors-delta").textContent = "latest captured errors";
            document.getElementById("metric-flags-delta").textContent = `${partialFlags.length} partial rollout`;
            document.getElementById("metric-latency-delta").textContent = "average loaded traces";

            if (state.apiError) {
                document.getElementById("summary-title").textContent = "Dashboard API is unavailable.";
                document.getElementById("summary-copy").textContent = state.apiError;
                document.getElementById("summary-actions").innerHTML = `<span class="badge bad"><span class="dot"></span>API error</span>`;
            }
            else if (latestFailedExecution) {
                document.getElementById("summary-title").textContent = `${latestFailedExecution.workflow} has a failed execution.`;
                document.getElementById("summary-copy").textContent = `Latest failed execution ${latestFailedExecution.id} failed at ${latestFailedExecution.failedStep || "an unknown step"}.`;
                document.getElementById("summary-actions").innerHTML = `
                    <span class="badge bad"><span class="dot"></span>${failedExecutions.length} failed executions</span>
                    <span class="badge warn"><span class="dot"></span>${runningExecutions.length} running executions</span>
                `;
            }
            else {
                document.getElementById("summary-title").textContent = state.executions.length ? "No failed executions in the loaded records." : "No workflow executions loaded yet.";
                document.getElementById("summary-copy").textContent = state.executions.length
                    ? "The overview is using the latest execution, error, trace, workflow, and flag rows returned by the dashboard API."
                    : "Run or trigger workflows in Flowwatch to populate dashboard tables.";
                document.getElementById("summary-actions").innerHTML = `
                    <span class="badge ok"><span class="dot"></span>${state.workflows.length} workflows</span>
                `;
            }

            document.getElementById("overview-executions").innerHTML = state.executions.length ? state.executions.slice(0, 5).map((execution) => `
                <tr data-execution="${escapeHtml(execution.id)}">
                    <td class="mono">${escapeHtml(execution.id)}</td>
                    <td>${escapeHtml(execution.workflow)}</td>
                    <td>${badgeForStatus(execution.status)}</td>
                    <td>${escapeHtml(execution.failedStep)}</td>
                    <td class="right mono">${escapeHtml(execution.duration)}</td>
                </tr>
            `).join("") : tableEmptyRow(5, "No execution records", "Workflow executions will appear after rows exist in flowwatch_workflow_executions.");

            document.getElementById("overview-errors").innerHTML = state.errors.length ? state.errors.slice(0, 4).map((error, index) => `
                <tr data-error="${index}">
                    <td>${escapeHtml(error.message)}</td>
                    <td>${badgeForStatus(error.category === "client" ? "queued" : "failed")}</td>
                    <td>${escapeHtml(error.source)}</td>
                    <td class="mono">${escapeHtml(error.trace)}</td>
                    <td class="right mono">${escapeHtml(error.occurred)}</td>
                </tr>
            `).join("") : tableEmptyRow(5, "No captured errors", "Captured errors will appear after rows exist in the Flowwatch error tables.");

            const overviewHealth = document.getElementById("overview-health");
            overviewHealth.classList.toggle("is-compact", state.health.length > 4);
            overviewHealth.innerHTML = state.health.length ? state.health.map((item) => `
                <div class="health-row">
                    <div class="health-top">
                        <div class="health-name">${escapeHtml(item.name)}</div>
                        ${badgeForStatus(item.status)}
                    </div>
                    <div class="muted" style="font-size: 12px;">${escapeHtml(item.description)}</div>
                    <div class="health-top mono subtle"><span>${item.latency > 0 ? item.latency + 'ms' : '--'} latency</span><span>last checked now</span></div>
                </div>
            `).join("") : `
                <div class="empty-state">
                    <div class="empty-title">No health checks loaded</div>
                    <div class="empty-copy">${escapeHtml(state.apiError) || "Health checks will appear after the dashboard API responds."}</div>
                </div>
            `;
        }

        function renderWorkflows() {
            const pinnedWorkflows = state.workflows.filter((workflow) => workflow.pinned).slice(0, 4);
            document.getElementById("workflow-chain-grid").innerHTML = pinnedWorkflows.length ? pinnedWorkflows.map((workflow) => `
                <div class="workflow-card" data-workflow="${escapeHtml(workflow.name)}">
                    <div class="workflow-card-head">
                        <div>
                            <div class="workflow-card-title">${escapeHtml(workflow.name)}</div>
                            <div class="mono subtle" style="font-size: 10px; margin-top: 4px;">v${escapeHtml(workflow.version)} / ${escapeHtml(workflow.steps)} steps</div>
                        </div>
                        ${badgeForStatus(workflow.lastStatus)}
                    </div>
                    <div class="workflow-chain">
                        ${workflow.chain.map((step, index) => `
                            ${index > 0 ? `<span class="chain-arrow ${getWorkflowArrowClass(workflow, step)}"></span>` : ""}
                            <div class="workflow-step ${getWorkflowStepClass(workflow, step)}">
                                <div class="workflow-step-name">${escapeHtml(step)}</div>
                                <div class="workflow-step-meta">step ${index + 1} / ${workflow.completedRuns || 0} runs ok</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `).join("") : `
                <div class="empty-state" style="grid-column: 1 / -1; margin: 0;">
                    <div class="empty-title">${escapeHtml(state.workflows.length ? "No pinned workflows" : "No workflow records")}</div>
                    <div class="empty-copy">${escapeHtml(state.workflows.length ? "Pin workflows from the table below." : "Rows from flowwatch_workflows will appear here.")}</div>
                </div>
            `;

            document.getElementById("workflow-table").innerHTML = state.workflows.length ? state.workflows.map((workflow) => `
                <tr data-workflow="${escapeHtml(workflow.name)}">
                    <td><strong>${escapeHtml(workflow.name)}</strong></td>
                    <td class="mono">v${escapeHtml(workflow.version)}</td>
                    <td class="mono">${escapeHtml(workflow.steps)}</td>
                    <td class="mono">${escapeHtml(workflow.created)}</td>
                    <td>${badgeForStatus(workflow.lastStatus)}</td>
                    <td><button class="pin-button ${workflow.pinned ? "active" : ""}" data-toggle-pin="${escapeHtml(workflow.name)}">${workflow.pinned ? "Pinned" : "Pin"}</button></td>
                    <td class="right mono">${workflow.totalRuns || 0} <span class="subtle">runs &middot; ${workflow.completedRuns || 0} ok &middot; ${workflow.failedRuns || 0} failed</span></td>
                </tr>
            `).join("") : tableEmptyRow(7, "No workflow records", "Registered workflows will appear after rows exist in flowwatch_workflows.");
        }

        function getWorkflowStepClass(workflow, step) {
            const execution = latestExecutionForWorkflow(workflow.name);
            const status = workflowStepStatus(workflow, step, execution);
            if (status === "completed") return "live";
            if (status === "running") return "running";
            if (status === "failed") return "failed";
            return "";
        }

        function getWorkflowArrowClass(workflow, step) {
            const execution = latestExecutionForWorkflow(workflow.name);
            const status = workflowStepStatus(workflow, step, execution);
            if (status === "completed") return "live";
            if (status === "running") return "running";
            if (status === "failed") return "failed";
            return "";
        }

        function renderExecutions() {
            const statusFilter = document.getElementById("execution-status-filter").value;
            const search = document.getElementById("execution-search").value.toLowerCase();
            const rows = state.executions.filter((execution) => {
                const statusMatch = statusFilter === "all" || execution.status === statusFilter;
                const textMatch = `${execution.id} ${execution.workflow}`.toLowerCase().includes(search);
                return statusMatch && textMatch;
            });

            document.getElementById("execution-table").innerHTML = rows.length ? rows.map((execution) => `
                <tr data-execution="${escapeHtml(execution.id)}">
                    <td class="mono">${escapeHtml(execution.id)}</td>
                    <td>${escapeHtml(execution.workflow)}</td>
                    <td>${badgeForStatus(execution.status)}</td>
                    <td class="mono">${escapeHtml(execution.started)}</td>
                    <td class="mono">${escapeHtml(execution.finished)}</td>
                    <td>${escapeHtml(execution.failedStep)}</td>
                    <td class="right mono">${escapeHtml(execution.attempts)}</td>
                </tr>
            `).join("") : tableEmptyRow(7, "No execution records", "Workflow execution rows from flowwatch_workflow_executions will appear here.");
        }

        function renderFlags() {
            document.getElementById("flag-table").innerHTML = state.flags.length ? state.flags.map((flag) => `
                <tr data-flag="${escapeHtml(flag.key)}">
                    <td><strong>${escapeHtml(flag.key)}</strong></td>
                    <td><button class="switch ${flag.enabled ? "on" : ""}" data-toggle-flag="${escapeHtml(flag.key)}" title="Toggle ${escapeHtml(flag.key)}"></button></td>
                    <td>
                        <div class="mono">${escapeHtml(flag.rollout)}%</div>
                        <div class="bar" style="margin-top: 6px;"><div class="bar-fill" style="width: ${escapeHtml(flag.rollout)}%;"></div></div>
                    </td>
                    <td class="mono">${escapeHtml(flag.rules)}</td>
                    <td>${escapeHtml(flag.changedBy)}</td>
                    <td class="right"><button class="button" data-delete-flag="${escapeHtml(flag.key)}">Delete</button></td>
                </tr>
            `).join("") : tableEmptyRow(6, "No feature flag records", "Feature flags from flowwatch_feature_flags will appear here.");
        }

        function renderErrors() {
            const category = document.getElementById("error-category-filter").value;
            const search = document.getElementById("error-search").value.toLowerCase();
            const rows = state.errors.filter((error) => {
                const categoryMatch = category === "all" || error.category === category;
                const textMatch = `${error.message} ${error.name} ${error.source}`.toLowerCase().includes(search);
                return categoryMatch && textMatch;
            });

            document.getElementById("error-table").innerHTML = rows.length ? rows.map((error, index) => `
                <tr data-error="${state.errors.indexOf(error)}">
                    <td>${escapeHtml(error.message)}</td>
                    <td>${escapeHtml(error.name)}</td>
                    <td>${escapeHtml(error.category)}</td>
                    <td>${error.level === "critical" ? badgeForStatus("failed") : `<span class="badge warn">${escapeHtml(error.level)}</span>`}</td>
                    <td>${escapeHtml(error.source)}</td>
                    <td class="mono">${escapeHtml(error.status)}</td>
                    <td class="mono">${escapeHtml(error.trace)}</td>
                    <td class="right mono">${escapeHtml(error.occurred)}</td>
                </tr>
            `).join("") : tableEmptyRow(8, "No captured error records", "Captured errors will appear after Flowwatch writes error rows.");
        }

        function renderTraces() {
            const statusGroup = document.getElementById("trace-status-filter").value;
            const search = document.getElementById("trace-search").value.toLowerCase();
            const rows = state.traces.filter((trace) => {
                const groupMatch = statusGroup === "all" || String(trace.status).startsWith(statusGroup);
                const textMatch = `${trace.id} ${trace.path} ${trace.ip}`.toLowerCase().includes(search);
                return groupMatch && textMatch;
            });

            document.getElementById("trace-table").innerHTML = rows.length ? rows.map((trace) => `
                <tr data-trace="${escapeHtml(trace.id)}" class="${trace.id === state._selectedTraceId ? 'selected-row' : ''}">
                    <td class="mono">${escapeHtml(trace.id.slice(0, 8))}&hellip;</td>
                    <td>${badgeForMethod(trace.method)}</td>
                    <td>${escapeHtml(trace.path)}</td>
                    <td class="mono">${escapeHtml(trace.status ?? '-')}</td>
                    <td class="mono">${escapeHtml(formatTime(trace.startedAt || trace.createdAt))}</td>
                    <td class="mono">${escapeHtml(trace.ip)}</td>
                    <td class="right mono">${trace.duration != null ? escapeHtml(trace.duration) + 'ms' : '-'}</td>
                </tr>
            `).join("") : tableEmptyRow(7, "No trace records", "Request trace rows from flowwatch_request_traces will appear here.");

            if (state._selectedTraceId) {
                // Re-render graph for selected trace when table refreshes
                const selected = state.traces.find(t => t.id === state._selectedTraceId);
                if (selected) renderTraceGraph(selected);
            } else {
                document.getElementById("trace-graph").innerHTML = `
                    <div class="trace-empty-copy">
                        <strong>Select a request to view its trace graph</strong>
                        <span>Click any row in the table above to visualize its span chain.</span>
                    </div>`;
                document.getElementById("trace-inspector-id").textContent = "-";
                document.getElementById("trace-inspector-critical").textContent = "-";
                document.getElementById("trace-span-list").innerHTML = "";
            }
        }

        function renderTraceGraph(trace) {
            if (!trace) {
                document.getElementById("trace-graph").innerHTML = `
                    <div class="trace-empty-copy">
                        <strong>No traces captured</strong>
                        <span>Request traces will appear here after the dashboard API has trace records.</span>
                    </div>
                `;
                document.getElementById("trace-inspector-id").textContent = "-";
                document.getElementById("trace-inspector-critical").textContent = "-";
                document.getElementById("trace-span-list").innerHTML = "";
                return;
            }

            // Build display spans: use real spans if available, otherwise synthesise from trace fields
            const rawSpans = trace.spans && trace.spans.length > 0 ? trace.spans : [];

            // Always include a synthetic root span for the HTTP request itself
            const rootSpan = {
                name: "http.request",
                type: "http",
                status: trace.status >= 500 ? "failed" : trace.status >= 400 ? "error" : "completed",
                duration: trace.duration ?? 0,
            };

            // Build the span list: root first, then real child spans
            const allSpans = [rootSpan, ...rawSpans];

            const nodeWidth = 142;
            const nodeHeight = 58;
            // Spread nodes in a single row
            const nodes = allSpans.map((span, index) => ({
                ...span,
                x: 42 + index * 200,
                y: span.type === "feature_flag" ? 46 : span.type === "database" ? 178 : span.type === "external_api" ? 178 : 112,
            }));
            const svgWidth = Math.max(800, nodes.length * 200 + 120);
            const svgHeight = 290;
            const truncate = (value, limit = 20) => value && value.length > limit ? `${value.slice(0, limit)}...` : (value || '');
            const nodeName = (span) => {
                if (!span.name) return 'Span';
                if (span.name === "http.request") return `${trace.method || "GET"} ${trace.path || "/"}`;
                if (span.name.startsWith("flowwatch.flag")) return "Feature Flag";
                if (span.name.startsWith("flowwatch.workflow")) return "Workflow";
                return span.name;
            };
            const nodeStatusClass = (span) => {
                const s = String(span.status || '');
                if (s === 'failed' || s === 'error') return 'failed';
                if (s === 'completed' || s === 'ok') return 'success';
                if (s === 'running') return 'running';
                // For HTTP status codes on root span
                const code = Number(trace.status);
                if (!isNaN(code)) return code >= 500 ? 'failed' : code >= 400 ? '' : 'success';
                return '';
            };
            const nodeSub = (span, index) => {
                if (index === 0) return trace.duration != null ? trace.duration + 'ms' : '';
                return span.duration != null ? span.duration + 'ms' : '';
            };
            const node = (span, index) => `
                <g class="trace-node ${nodeStatusClass(span) || (index === 0 ? 'active' : '')}" data-node-span="${index}">
                    <title>${escapeHtml(nodeName(span))}</title>
                    <rect x="${span.x}" y="${span.y}" width="${nodeWidth}" height="${nodeHeight}"></rect>
                    <text x="${span.x + nodeWidth / 2}" y="${span.y + nodeHeight / 2 - 7}" class="trace-node-name" clip-path="url(#trace-node-clip-${index})">${escapeHtml(truncate(nodeName(span), 18))}</text>
                    <text x="${span.x + nodeWidth / 2}" y="${span.y + nodeHeight / 2 + 11}" class="trace-node-sub">${nodeSub(span, index)}</text>
                </g>
            `;
            const edge = (from, to) => {
                const x1 = from.x + nodeWidth;
                const y1 = from.y + nodeHeight / 2;
                const x2 = to.x;
                const y2 = to.y + nodeHeight / 2;
                const sc = nodeStatusClass(to);
                const marker = sc === "failed" ? "url(#arrow-hot)" : sc === "success" ? "url(#arrow-success)" : sc === "running" ? "url(#arrow-running)" : "url(#arrow)";
                const edgeClass = sc === "failed" ? "hot" : sc || '';
                const pathD = `M${x1} ${y1} C${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`;
                return `
                    <path class="trace-edge ${edgeClass}" marker-end="${marker}" d="${pathD}"></path>
                    <circle r="4" class="trace-packet ${sc === 'failed' ? 'hot' : sc === 'running' ? 'running' : ''}">
                        <animateMotion dur="${sc === 'failed' ? '1.2s' : sc === 'running' ? '1.6s' : '2.2s'}" repeatCount="indefinite" path="${pathD}"></animateMotion>
                    </circle>
                `;
            };

            document.getElementById("trace-graph").innerHTML = `
                <svg class="trace-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Trace chain graph for ${escapeHtml(trace.id)}">
                    <defs>
                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#3b4658"></path>
                        </marker>
                        <marker id="arrow-hot" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444"></path>
                        </marker>
                        <marker id="arrow-success" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#22c55e"></path>
                        </marker>
                        <marker id="arrow-running" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b"></path>
                        </marker>
                        ${nodes.map((span, index) => `
                            <clipPath id="trace-node-clip-${index}">
                                <rect x="${span.x + 12}" y="${span.y + 11}" width="${nodeWidth - 24}" height="18" rx="2"></rect>
                            </clipPath>
                        `).join("")}
                    </defs>
                    ${nodes.slice(0, -1).map((span, index) => edge(span, nodes[index + 1])).join("")}
                    ${nodes.map((span, index) => node(span, index)).join("")}
                </svg>
                <div class="trace-request-card">
                    <div class="trace-request-title">${escapeHtml(trace.method)} ${escapeHtml(trace.path)}</div>
                    <div class="trace-request-meta">${escapeHtml(trace.id)} &middot; ${escapeHtml(trace.status ?? '-')} &middot; ${trace.duration != null ? escapeHtml(trace.duration) + 'ms' : 'pending'} &middot; ${escapeHtml(formatTime(trace.startedAt || trace.createdAt))}</div>
                </div>
            `;

            document.getElementById("trace-inspector-id").textContent = trace.id;
            document.getElementById("trace-inspector-critical").textContent = trace.duration != null ? `${trace.duration}ms` : 'pending';
            document.getElementById("trace-span-list").innerHTML = allSpans.map((span, index) => `
                <div class="span-row">
                    <div>
                        <div class="span-name">${escapeHtml(nodeName(span))}</div>
                        <div class="span-type">${escapeHtml(span.type)}${index === 0 ? ` &middot; ${escapeHtml(trace.status ?? 'pending')}` : ` &middot; ${escapeHtml(span.status)}`}</div>
                    </div>
                    <span class="mono ${nodeStatusClass(span) === 'failed' ? 'bad' : 'muted'}">${nodeSub(span, index) || '-'}</span>
                </div>
            `).join("");
        }

        function renderGlobalSearch() {
            const query = globalSearchInput.value.trim().toLowerCase();

            if (!query) {
                globalSearchResults.innerHTML = `
                    <div class="search-result" data-go="errors">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Open captured errors</span>
                        <span class="mono subtle">Errors</span>
                    </div>
                    <div class="search-result" data-go="traces">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Open trace graph and request spans</span>
                        <span class="mono subtle">Traces</span>
                    </div>
                    <div class="search-result" data-go="ai-insights">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Open AI incident insights</span>
                        <span class="mono subtle">AI Insights</span>
                    </div>
                    <div class="search-result" data-go="ask-ai">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Ask Flowwatch AI</span>
                        <span class="mono subtle">AI</span>
                    </div>
                    <div class="search-result" data-go="executions">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Inspect workflow executions</span>
                        <span class="mono subtle">Executions</span>
                    </div>
                `;
                return;
            }

            const results = [
                ...state.executions.map((item) => ({
                    type: "execution",
                    title: `${item.id} / ${item.workflow}`,
                    meta: item.status,
                    action: "executions"
                })),
                ...state.errors.map((item) => ({
                    type: "error",
                    title: item.message,
                    meta: item.source,
                    action: "errors"
                })),
                ...state.traces.map((item) => ({
                    type: "trace",
                    title: `${item.id} ${item.method} ${item.path}`,
                    meta: `${item.duration}ms`,
                    action: "traces"
                })),
                ...state.flags.map((item) => ({
                    type: "flag",
                    title: item.key,
                    meta: `${item.rollout}% rollout`,
                    action: "flags"
                })),
                {
                    type: "insight",
                    title: "AI incident insights from traces workflows flags and errors",
                    meta: "AI Insights",
                    action: "ai-insights"
                },
                {
                    type: "ai",
                    title: "Ask Flowwatch AI about traces errors workflows and health",
                    meta: "Ask Flowwatch AI",
                    action: "ask-ai"
                }
            ].filter((item) => `${item.type} ${item.title} ${item.meta}`.toLowerCase().includes(query)).slice(0, 6);

            globalSearchResults.innerHTML = results.length ? results.map((item) => `
                <div class="search-result" data-go="${escapeHtml(item.action)}">
                    <span class="result-type">${escapeHtml(item.type)}</span>
                    <span class="result-title">${escapeHtml(item.title)}</span>
                    <span class="mono subtle">${escapeHtml(item.meta)}</span>
                </div>
            `).join("") : `
                <div class="search-result">
                    <span class="result-type">No match</span>
                    <span class="result-title">No local dashboard result for "${escapeHtml(query)}"</span>
                    <span class="mono subtle">search</span>
                </div>
            `;
        }

        function renderHealth() {
            const postgresHealth = state.health.find((item) => item.name === "Postgres");
            const workerHealth = state.health.find((item) => item.name === "BullMQ Worker");

            document.getElementById("sidebar-postgres").outerHTML = postgresHealth
                ? `<span id="sidebar-postgres">${badgeForStatus(postgresHealth.status)}</span>`
                : `<span id="sidebar-postgres" class="badge warn"><span class="dot"></span>unknown</span>`;
            document.getElementById("sidebar-worker").outerHTML = workerHealth
                ? `<span id="sidebar-worker">${badgeForStatus(workerHealth.status)}</span>`
                : `<span id="sidebar-worker" class="badge warn"><span class="dot"></span>unknown</span>`;

            document.getElementById("health-cards").innerHTML = state.health.length ? state.health.map((item) => `
                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">${escapeHtml(item.name)}</div>
                        ${badgeForStatus(item.status)}
                    </div>
                    <div style="padding: 14px; display: grid; gap: 12px;">
                        <div class="muted">${escapeHtml(item.description)}</div>
                        <div class="field-grid">
                            <div class="field"><div class="field-label">Latency</div><div class="field-value mono">${item.latency > 0 ? escapeHtml(item.latency) + 'ms' : '--'}</div></div>
                            <div class="field"><div class="field-label">Last checked</div><div class="field-value mono">now</div></div>
                        </div>
                    </div>
                </div>
            `).join("") : `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-title">No health checks loaded</div>
                    <div class="empty-copy">${escapeHtml(state.apiError || "Health checks will appear after the dashboard API responds.")}</div>
                </div>
            `;
        }

        function renderSettings() {
            const settings = state.settings || {};
            const dashboard = settings.dashboard || {};
            const ai = settings.ai || {};
            const setSwitch = (id, enabled) => {
                const element = document.getElementById(id);
                if (!element) return;
                element.classList.toggle("on", Boolean(enabled));
                element.title = enabled ? "Enabled" : "Disabled";
            };

            const envInput = document.getElementById("setting-environment-input");
            if (envInput && !envInput.matches(":focus")) envInput.value = settings.environment || state.environment || "";

            const modelSelect = document.getElementById("setting-groq-model-select");
            if (modelSelect) {
                const savedModel = ai.groqModel || "llama-3.3-70b-versatile";
                modelSelect.value = savedModel;
            }

            setSwitch("setting-dashboard-enabled", dashboard.enabled);

            const keyStatus = document.getElementById("setting-groq-api-key-status");
            if (keyStatus) {
                keyStatus.textContent = ai.groqApiKeyConfigured ? "configured" : "not configured";
                keyStatus.className = "setting-note " + (ai.groqApiKeyConfigured ? "status-ok" : "status-missing");
            }
            state.selectedGroqModel = ai.groqModel || state.selectedGroqModel || "llama-3.3-70b-versatile";
            renderGroqModelControls();
        }

        async function saveSetting(settingName, value, statusElId) {
            const statusEl = document.getElementById(statusElId);
            if (statusEl) {
                statusEl.textContent = "saving...";
                statusEl.className = "setting-note";
            }

            try {
                const res = await apiRequest("settings", {
                    method: "POST",
                    body: JSON.stringify({ [settingName]: value })
                });

                if (res && res.settings) {
                    state.settings = res.settings;
                    renderSettings();
                }

                if (statusEl) {
                    statusEl.textContent = "saved";
                    statusEl.className = "setting-note status-ok";
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = error.message || "failed";
                    statusEl.className = "setting-note status-missing";
                }
            }
        }

        async function toggleSetting(settingName, elementId) {
            const el = document.getElementById(elementId);
            if (!el) return;
            const isCurrentlyOn = el.classList.contains("on");
            const newValue = !isCurrentlyOn;

            // Optimistic visual update
            el.classList.toggle("on", newValue);
            el.title = newValue ? "Enabled" : "Disabled";

            try {
                const res = await apiRequest("settings", {
                    method: "POST",
                    body: JSON.stringify({ [settingName]: newValue })
                });

                if (res && res.settings) {
                    state.settings = res.settings;
                    renderSettings();
                }
            } catch (error) {
                console.error("Failed to toggle setting:", error);
                // Revert
                el.classList.toggle("on", isCurrentlyOn);
                el.title = isCurrentlyOn ? "Enabled" : "Disabled";
            }
        }

        async function saveGroqApiKey() {
            const input = document.getElementById("setting-groq-api-key-input");
            const statusEl = document.getElementById("setting-groq-api-key-status");
            const key = input.value.trim();
            if (!key) return;

            const modelSelect = document.getElementById("setting-groq-model-select");
            const model = modelSelect ? modelSelect.value : undefined;

            statusEl.textContent = "saving...";
            statusEl.className = "setting-note";

            try {
                const body = { groqApiKey: key };
                if (model) body.groqModel = model;

                await apiRequest("settings/ai-key", {
                    method: "POST",
                    body: JSON.stringify(body),
                });

                // Update in-memory state ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â backend is the source of truth
                state.settings = state.settings || {};
                state.settings.ai = state.settings.ai || {};
                state.settings.ai.groqApiKeyConfigured = true;
                if (model) state.settings.ai.groqModel = model;

                statusEl.textContent = "saved";
                statusEl.className = "setting-note status-ok";
                input.value = "";
                // Show masked indicator after save
                input.placeholder = "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢" + key.slice(-4);
            }
            catch (error) {
                statusEl.textContent = error.message || "failed";
                statusEl.className = "setting-note status-missing";
            }
        }

        function loadSavedGroqCredentials() {
            // Key status comes from backend settings (state.settings.ai) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â never from localStorage
            // Model preference also comes from backend settings
            const ai = state.settings?.ai || {};
            const keyInput = document.getElementById("setting-groq-api-key-input");
            const modelSelect = document.getElementById("setting-groq-model-select");

            if (ai.groqApiKeyConfigured && keyInput) {
                keyInput.placeholder = "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ (configured)";
            }
            if (ai.groqModel && modelSelect) {
                modelSelect.value = ai.groqModel;
                state._savedGroqModel = ai.groqModel;
            }
        }

        function selectedGroqModel() {
            return state.selectedGroqModel || state.settings?.ai?.groqModel || "llama-3.3-70b-versatile";
        }

        function groqModelOptions() {
            return Array.from(new Set([
                selectedGroqModel(),
                state.settings?.ai?.groqModel,
                ...state.groqModels.map((model) => model.id || model),
                ...SEEDED_GROQ_MODELS,
            ].filter(Boolean)));
        }

        function renderGroqModelControls() {
            const value = selectedGroqModel();
            const options = groqModelOptions();
            const settingSelect = document.getElementById("setting-groq-model-select");

            if (settingSelect) {
                settingSelect.innerHTML = options.map((model) => `<option value="${escapeHtml(model)}"${model === value ? " selected" : ""}>${escapeHtml(model)}</option>`).join("");
                settingSelect.value = value;
            }
        }

        function renderAiPlaceholders() {
            const workflowCount = document.getElementById("ai-workflow-count");
            const executionCount = document.getElementById("ai-execution-count");
            const errorCount = document.getElementById("ai-error-count");
            const lockedShell = document.getElementById("ai-locked-shell");
            const insight = state.aiInsight;
            const evidence = insight?.evidence || [];
            const actions = insight?.recommendedActions || [];

            if (state.aiInsightLoading) {
                state.aiKeyMissing = false;
            }

            if (lockedShell) {
                lockedShell.classList.toggle("is-locked", state.aiKeyMissing);
            }

            if (workflowCount) workflowCount.textContent = insight?.sourceCounts?.workflows ?? state.workflows.length;
            if (executionCount) executionCount.textContent = insight?.sourceCounts?.executions ?? state.executions.length;
            if (errorCount) errorCount.textContent = insight?.sourceCounts?.errors ?? state.errors.length;

            document.getElementById("ai-confidence").textContent = `${insight?.confidence ?? 0}%`;

            if (state.aiInsightLoading) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge warn is-live"><span class="dot"></span>generating</span>`;
                document.getElementById("ai-insight-summary").textContent = "Sending current Flowwatch table context to Groq.";
                document.getElementById("ai-insight-cause").textContent = "The server is gathering workflows, executions, traces, errors, flags, and health checks before calling the model.";
                return;
            }

            if (state.aiKeyMissing) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge warn"><span class="dot"></span>API key required</span>`;
                document.getElementById("ai-insight-summary").textContent = "Insert the API key in the settings page.";
                document.getElementById("ai-insight-cause").textContent = "AI Insights is locked until GROQ_API_KEY is configured on the backend.";
                document.getElementById("ai-insight-impact").textContent = "AI generation is disabled until the server has a Groq API key.";
                document.getElementById("ai-evidence-count").textContent = "0 items";
                document.getElementById("ai-action-count").textContent = "0 actions";
                document.getElementById("ai-evidence-preview").textContent = "Add GROQ_API_KEY in settings.";
                document.getElementById("ai-action-preview").textContent = "Open settings to configure the AI provider.";
                document.getElementById("ai-evidence-list").innerHTML = "";
                document.getElementById("ai-action-list").innerHTML = "";
                return;
            }

            if (state.aiInsightError) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge bad"><span class="dot"></span>error</span>`;
                document.getElementById("ai-insight-summary").textContent = "Could not generate AI insight.";
                document.getElementById("ai-insight-cause").textContent = state.aiInsightError;
                return;
            }

            if (!insight) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge warn"><span class="dot"></span>not loaded</span>`;
                document.getElementById("ai-evidence-list").innerHTML = "";
                document.getElementById("ai-action-list").innerHTML = "";
                return;
            }

            document.getElementById("ai-insight-status").outerHTML = state.aiModelConfigured
                ? `<span id="ai-insight-status" hidden></span>`
                : `<span id="ai-insight-status" class="badge warn"><span class="dot"></span>not configured</span>`;
            document.getElementById("ai-insight-summary").textContent = insight.summary;
            document.getElementById("ai-insight-cause").textContent = insight.likelyCause;
            document.getElementById("ai-insight-impact").textContent = insight.impact;
            document.getElementById("ai-evidence-count").textContent = `${evidence.length} item${evidence.length === 1 ? "" : "s"}`;
            document.getElementById("ai-action-count").textContent = `${actions.length} action${actions.length === 1 ? "" : "s"}`;
            document.getElementById("ai-evidence-preview").textContent = evidence[0] || "No evidence returned.";
            document.getElementById("ai-action-preview").textContent = actions[0] || "No action returned.";
            document.getElementById("ai-evidence-list").innerHTML = evidence.length ? evidence.map((item, index) => `
                <div class="ai-action">
                    <div class="ai-action-index">${index + 1}</div>
                    <div><div class="ai-action-title">${escapeHtml(item)}</div></div>
                </div>
            `).join("") : `<div class="empty-state"><div class="empty-title">No evidence returned</div></div>`;
            document.getElementById("ai-action-list").innerHTML = actions.length ? actions.map((item, index) => `
                <div class="ai-action">
                    <div class="ai-action-index">${index + 1}</div>
                    <div><div class="ai-action-title">${escapeHtml(item)}</div></div>
                </div>
            `).join("") : `<div class="empty-state"><div class="empty-title">No actions returned</div></div>`;
        }

        async function loadAiInsights() {
            state.aiInsightLoading = true;
            state.aiInsightError = null;
            state.aiKeyMissing = false;
            renderAiPlaceholders();

            try {
                const data = await apiRequest("ai-insights");
                state.aiInsight = data.insight || null;
                state.aiModelConfigured = Boolean(data.modelConfigured);
                state.aiKeyMissing = false;
            }
            catch (error) {
                state.aiInsight = null;
                state.aiModelConfigured = false;
                state.aiKeyMissing = error?.status === 428 || error?.code === "groq_api_key_missing";
                state.aiInsightError = state.aiKeyMissing ? null : error instanceof Error ? error.message : "AI insight request failed";
            }
            finally {
                state.aiInsightLoading = false;
                renderAiPlaceholders();
            }
        }

        async function loadGroqModelsForSettings() {
            try {
                const response = await fetch(apiPath("ai-models"));
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.models) && data.models.length > 0) {
                        state.groqModels = data.models;
                        renderGroqModelControls();
                    }
                }
            } catch (err) {
                console.error("Failed to load Groq models for settings:", err);
            }
        }

        function initAiChat() {
            state.aiMessages = [];
            renderMessages();
        }

        function saveMessages() {
            // AI chat history is intentionally session-only.
        }

        function clearAiChat() {
            state.aiMessages = [];
            saveMessages();
            renderMessages();
        }

        function renderMessages() {
            const welcomeEl = document.getElementById("ask-ai-welcome");
            const messagesEl = document.getElementById("ask-ai-messages");
            if (!welcomeEl || !messagesEl) return;

            const messages = state.aiMessages || [];
            if (messages.length === 0) {
                welcomeEl.style.display = "flex";
                messagesEl.style.display = "none";
                return;
            }

            welcomeEl.style.display = "none";
            messagesEl.style.display = "grid";

            messagesEl.innerHTML = messages.map(msg => `
                <div class="ask-message ${msg.role === 'user' ? 'user' : ''}">
                    ${msg.role !== 'user' ? `<div class="ask-avatar">AI</div>` : ''}
                    <div class="ask-bubble ${msg.role === 'user' ? '' : 'ai-response'}">
                        ${msg.role === 'user' ? escapeHtml(msg.content).replace(/\n/g, '<br>') : formatMessageMarkdown(msg.content)}
                    </div>
                    ${msg.role === 'user' ? `<div class="ask-avatar">ME</div>` : ''}
                </div>
            `).join("");

            // Scroll chat content wrapper to bottom
            const contentEl = document.getElementById("ask-ai-content");
            if (contentEl) {
                setTimeout(() => {
                    contentEl.scrollTop = contentEl.scrollHeight;
                }, 10);
            }
        }

        function formatMessageMarkdown(content) {
            const source = String(content || "").trim();
            if (source === "...") {
                return `<p>Thinking...</p>`;
            }

            const blocks = [];
            const codeBlocks = [];
            const withoutCode = source.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (_match, code) => {
                const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
                codeBlocks.push(`<pre><code>${escapeHtml(String(code).trim())}</code></pre>`);
                return `\n${token}\n`;
            });

            const lines = withoutCode.split(/\r?\n/);
            let paragraph = [];
            let listItems = [];
            let listType = null;

            const inlineFormat = (value) => escapeHtml(value)
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

            const flushParagraph = () => {
                if (!paragraph.length) return;
                blocks.push(`<p>${inlineFormat(paragraph.join(" "))}</p>`);
                paragraph = [];
            };

            const flushList = () => {
                if (!listItems.length) return;
                const tag = listType === "ol" ? "ol" : "ul";
                blocks.push(`<${tag}>${listItems.map(item => `<li>${inlineFormat(item)}</li>`).join("")}</${tag}>`);
                listItems = [];
                listType = null;
            };

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line) {
                    flushParagraph();
                    flushList();
                    continue;
                }

                const codeMatch = line.match(/^@@CODE_BLOCK_(\d+)@@$/);
                if (codeMatch) {
                    flushParagraph();
                    flushList();
                    blocks.push(codeBlocks[Number(codeMatch[1])] || "");
                    continue;
                }

                const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
                if (headingMatch) {
                    flushParagraph();
                    flushList();
                    const level = headingMatch[1].length <= 3 ? "h3" : "h4";
                    blocks.push(`<${level}>${inlineFormat(headingMatch[2])}</${level}>`);
                    continue;
                }

                const bulletMatch = line.match(/^[-*]\s+(.+)$/);
                if (bulletMatch) {
                    flushParagraph();
                    if (listType && listType !== "ul") flushList();
                    listType = "ul";
                    listItems.push(bulletMatch[1]);
                    continue;
                }

                const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
                if (numberedMatch) {
                    flushParagraph();
                    if (listType && listType !== "ol") flushList();
                    listType = "ol";
                    listItems.push(numberedMatch[1]);
                    continue;
                }

                paragraph.push(line);
            }

            flushParagraph();
            flushList();

            return blocks.join("") || `<p>${inlineFormat(source)}</p>`;
        }

        async function sendMessage() {
            const inputEl = document.getElementById("ask-ai-input");
            if (!inputEl) return;

            const text = inputEl.value.trim();
            if (!text) return;

            // Push User Message
            state.aiMessages.push({ role: "user", content: text });

            inputEl.value = "";
            saveMessages();
            renderMessages();

            // Push Typing Indicator
            state.aiMessages.push({ role: "ai", content: "..." });
            renderMessages();

            try {
                // Prepare context/history (excluding the typing indicator)
                const history = state.aiMessages
                    .slice(0, state.aiMessages.length - 2)
                    .map(message => ({
                        role: message.role === "user" ? "user" : "assistant",
                        content: message.content
                    }));

                const response = await fetch(apiPath("ai-chat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: text,
                        history: history
                    })
                });

                // Remove typing indicator
                state.aiMessages.pop();

                if (response.ok) {
                    const data = await response.json();
                    state.aiMessages.push({ role: "ai", content: data.response || "No response returned." });
                } else {
                    const err = await response.json();
                    state.aiMessages.push({ role: "ai", content: `Error: ${err?.error?.message || "Failed to communicate with Groq API"}` });
                }
            } catch (err) {
                // Remove typing indicator
                state.aiMessages.pop();
                state.aiMessages.push({ role: "ai", content: `Error: ${err.message || "Failed to send message."}` });
            } finally {
                saveMessages();
                renderMessages();
            }
        }

        function renderAll() {
            renderOverview();
            renderWorkflows();
            renderExecutions();
            renderFlags();
            renderErrors();
            renderTraces();
            renderHealth();
            renderSettings();
            renderAiPlaceholders();
        }

        function workflowDetail(workflow) {
            const execution = latestExecutionForWorkflow(workflow.name);
            const allExecs = allExecutionsForWorkflow(workflow.name);
            const steps = workflowExecutionSteps(workflow, execution);

            const execHistoryRows = allExecs.length
                ? allExecs.map((ex) => `
                    <tr data-execution="${escapeHtml(ex.id)}" style="cursor:pointer">
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.id.slice(0, 8))}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</td>
                        <td>${badgeForStatus(ex.status)}</td>
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.started || '-')}</td>
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.finished || '-')}</td>
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.failedStep !== '-' ? ex.failedStep : '')}</td>
                    </tr>
                `).join("")
                : `<tr><td colspan="5" style="padding:12px;color:var(--muted);text-align:center">No executions recorded yet</td></tr>`;

            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Total runs</div><div class="field-value mono">${workflow.totalRuns || 0}</div></div>
                    <div class="field"><div class="field-label">Completed</div><div class="field-value mono" style="color:var(--green)">${workflow.completedRuns || 0}</div></div>
                    <div class="field"><div class="field-label">Failed</div><div class="field-value mono" style="color:var(--red)">${workflow.failedRuns || 0}</div></div>
                    <div class="field"><div class="field-label">Version</div><div class="field-value mono">v${escapeHtml(workflow.version)}</div></div>
                </div>
                <div class="panel" style="box-shadow:none;margin-bottom:14px">
                    <div class="panel-header">
                        <div class="panel-title">Execution history</div>
                    </div>
                    <div class="table-wrap" style="max-height:200px;overflow-y:auto">
                        <table>
                            <thead><tr>
                                <th>ID</th><th>Status</th><th>Started</th><th>Finished</th><th>Failed step</th>
                            </tr></thead>
                            <tbody>${execHistoryRows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="panel" style="box-shadow: none;">
                    <div class="panel-header">
                        <div class="panel-title">Latest execution steps</div>
                    </div>
                    <div class="timeline">
                        ${steps.map((step) => `
                            <div class="timeline-item">
                                <div class="timeline-rail">
                                    ${step.error ? `
                                        <button type="button" class="timeline-node bad" title="Open ${escapeHtml(step.name)} error" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">${step.index + 1}</button>
                                    ` : `
                                        <div class="timeline-node ${step.status === "failed" ? "bad" : step.status === "completed" ? "ok" : "warn"}">${step.index + 1}</div>
                                    `}
                                    ${step.index === steps.length - 1 ? "" : `<div class="timeline-line"></div>`}
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-title"><span>${escapeHtml(step.name)}</span><span class="mono muted">${escapeHtml(step.duration)}</span></div>
                                    <div class="timeline-desc">${badgeForStepStatus(step.status)} <span class="mono subtle">attempts: ${escapeHtml(step.attempts)}</span></div>
                                    ${step.error ? `<button type="button" class="timeline-error-action" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">Open error: ${escapeHtml(step.error.name)}</button>` : ""}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        function executionDetail(execution) {
            const workflow = state.workflows.find((item) => item.name === execution.workflow) || {
                name: execution.workflow,
                chain: (execution.steps || []).map((step) => step.stepName || step.name),
                lastStatus: execution.status,
                failures: execution.status === "failed" ? 1 : 0,
            };
            const steps = workflowExecutionSteps(workflow, execution);

            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Workflow</div><div class="field-value">${escapeHtml(execution.workflow)}</div></div>
                    <div class="field"><div class="field-label">Status</div><div class="field-value">${badgeForStatus(execution.status)}</div></div>
                    <div class="field"><div class="field-label">Started</div><div class="field-value mono">${escapeHtml(execution.started)}</div></div>
                    <div class="field"><div class="field-label">Duration</div><div class="field-value mono">${escapeHtml(execution.duration)}</div></div>
                </div>
                <div class="panel" style="box-shadow: none;">
                    <div class="panel-header"><div class="panel-title">Step timeline</div></div>
                    <div class="timeline">
                        ${steps.map((step, index) => `
                            <div class="timeline-item">
                                <div class="timeline-rail">
                                    ${step.error ? `
                                        <button type="button" class="timeline-node bad" title="Open ${escapeHtml(step.name)} error" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">${index + 1}</button>
                                    ` : `
                                        <div class="timeline-node ${step.status === "failed" ? "bad" : step.status === "completed" ? "ok" : "warn"}">${index + 1}</div>
                                    `}
                                    ${index === steps.length - 1 ? "" : `<div class="timeline-line"></div>`}
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-title"><span>${escapeHtml(step.name)}</span><span class="mono muted">${escapeHtml(step.duration)}</span></div>
                                    <div class="timeline-desc">${badgeForStepStatus(step.status)} <span class="mono subtle">attempts: ${escapeHtml(step.attempts)}</span></div>
                                    ${step.error ? `<button type="button" class="timeline-error-action" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">Open error: ${escapeHtml(step.error.name)}</button>` : ""}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        function errorDetail(error) {
            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Name</div><div class="field-value">${escapeHtml(error.name)}</div></div>
                    <div class="field"><div class="field-label">Category</div><div class="field-value">${escapeHtml(error.category)}</div></div>
                    <div class="field"><div class="field-label">Level</div><div class="field-value">${escapeHtml(error.level)}</div></div>
                    <div class="field"><div class="field-label">Trace ID</div><div class="field-value mono">${escapeHtml(error.trace)}</div></div>
                </div>
                <div class="field" style="margin-bottom: 12px;"><div class="field-label">Message</div><div class="field-value">${escapeHtml(error.message)}</div></div>
                <pre class="code-box">Error: ${escapeHtml(error.message)}
    at runWorkflowStep (workflowWorker.ts:74:15)
    at executeWorkflow (workflowWorker.ts:39:9)
    at Worker.processJob (bullmq)</pre>
            `;
        }

        function traceDetail(trace) {
            const spans = trace.spans || [];

            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Request</div><div class="field-value">${escapeHtml(trace.method)} ${escapeHtml(trace.path)}</div></div>
                    <div class="field"><div class="field-label">Status code</div><div class="field-value mono">${escapeHtml(trace.status)}</div></div>
                    <div class="field"><div class="field-label">IP address</div><div class="field-value mono">${escapeHtml(trace.ip)}</div></div>
                    <div class="field"><div class="field-label">Duration</div><div class="field-value mono">${escapeHtml(trace.duration)}ms</div></div>
                </div>
                <div class="timeline">
                    ${spans.map((span, index) => `
                        <div class="timeline-item">
                            <div class="timeline-rail">
                                <div class="timeline-node ${span.status === "failed" ? "bad" : "ok"}">${index + 1}</div>
                                ${index === spans.length - 1 ? "" : `<div class="timeline-line"></div>`}
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title"><span>${escapeHtml(span.name)}</span><span class="mono muted">${escapeHtml(span.duration)}ms</span></div>
                                <div class="timeline-desc">${badgeForStatus(span.status)}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        pageButtons.forEach((button) => button.addEventListener("click", () => showPage(button.dataset.pageButton)));
        document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.go)));
        document.getElementById("close-drawer").addEventListener("click", closeDrawer);
        document.getElementById("execution-status-filter").addEventListener("change", renderExecutions);
        document.getElementById("execution-search").addEventListener("input", renderExecutions);
        document.getElementById("error-category-filter").addEventListener("change", renderErrors);
        document.getElementById("error-search").addEventListener("input", renderErrors);
        document.getElementById("trace-status-filter").addEventListener("change", renderTraces);
        document.getElementById("trace-search").addEventListener("input", renderTraces);
        document.getElementById("refresh-button").addEventListener("click", loadDashboardData);
        document.getElementById("open-flag-modal").addEventListener("click", () => flagModal.classList.add("open"));
        document.getElementById("close-flag-modal").addEventListener("click", () => flagModal.classList.remove("open"));
        document.getElementById("cancel-flag").addEventListener("click", () => flagModal.classList.remove("open"));


        document.getElementById("setting-environment-save").addEventListener("click", () => {
            saveSetting("environment", document.getElementById("setting-environment-input").value.trim(), "setting-environment-status");
        });
        document.getElementById("setting-environment-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter") document.getElementById("setting-environment-save").click();
        });

        document.getElementById("setting-dashboard-enabled").addEventListener("click", () => {
            toggleSetting("dashboardEnabled", "setting-dashboard-enabled");
        });

        document.getElementById("setting-groq-api-key-save").addEventListener("click", saveGroqApiKey);
        document.getElementById("setting-groq-api-key-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter") saveGroqApiKey();
        });
        document.getElementById("setting-groq-model-save").addEventListener("click", async () => {
            const select = document.getElementById("setting-groq-model-select");
            const statusEl = document.getElementById("setting-groq-model-status");
            const model = select.value;
            if (!model) return;

            statusEl.textContent = "saving...";
            statusEl.className = "setting-note";

            try {
                const keyInput = document.getElementById("setting-groq-api-key-input");
                const key = keyInput ? keyInput.value.trim() : undefined;

                const body = { groqModel: model };
                if (key) body.groqApiKey = key;

                await apiRequest("settings/ai-key", {
                    method: "POST",
                    body: JSON.stringify(body),
                });

                state.settings.ai = state.settings.ai || {};
                state.settings.ai.groqModel = model;
                state.selectedGroqModel = model;
                if (key) {
                    state.settings.ai.groqApiKeyConfigured = true;
                    keyInput.value = "";
                }

                statusEl.textContent = "saved";
                statusEl.className = "setting-note status-ok";
                renderGroqModelControls();
            }
            catch (error) {
                statusEl.textContent = error.message || "failed";
                statusEl.className = "setting-note status-missing";
            }
        });

        document.getElementById("ask-ai-clear-btn").addEventListener("click", clearAiChat);
        document.getElementById("ask-ai-submit-btn").addEventListener("click", sendMessage);
        document.getElementById("ask-ai-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        globalSearchInput.addEventListener("focus", () => {
            globalSearchShell.classList.add("open");
            renderGlobalSearch();
        });
        globalSearchInput.addEventListener("input", renderGlobalSearch);

        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                globalSearchInput.focus();
            }

            if (event.key === "Escape") {
                globalSearchShell.classList.remove("open");
                closeDrawer();
                flagModal.classList.remove("open");
            }
        });

        document.getElementById("flag-form").addEventListener("submit", async (event) => {
            event.preventDefault();
            const draft = {
                key: document.getElementById("flag-key").value.trim(),
                description: document.getElementById("flag-description").value.trim(),
                enabled: false,
                rolloutPercentage: Number(document.getElementById("flag-rollout").value || 0),
                changedBy: "dashboard",
            };

            try {
                const { flag } = await apiRequest("flags", {
                    method: "POST",
                    body: JSON.stringify(draft),
                });
                state.flags.unshift(normalizeFlag(flag));
            }
            catch (error) {
                if (state.apiBacked) {
                    alert(error instanceof Error ? error.message : "Could not create feature flag.");
                    return;
                }

                state.flags.unshift(normalizeFlag({
                    key: draft.key,
                    description: draft.description,
                    enabled: draft.enabled,
                    rollout: draft.rolloutPercentage,
                    rules: 0,
                    changedBy: draft.changedBy,
                }));
            }

            document.getElementById("flag-form").reset();
            flagModal.classList.remove("open");
            renderFlags();
        });

        document.addEventListener("click", async (event) => {
            const askPrompt = event.target.closest("[data-ask-prompt]");
            if (askPrompt) {
                const askInput = document.getElementById("ask-ai-input");
                if (askInput) {
                    askInput.value = askPrompt.dataset.askPrompt;
                    askInput.focus();
                }
                return;
            }

            const workflowErrorNode = event.target.closest("[data-workflow-error]");
            if (workflowErrorNode) {
                event.stopPropagation();
                const workflow = state.workflows.find((item) => item.name === workflowErrorNode.dataset.workflowError);
                const stepName = workflowErrorNode.dataset.step;

                if (workflow && stepName) {
                    const execution = latestExecutionForWorkflow(workflow.name);
                    const step = workflowExecutionSteps(workflow, execution).find((item) => item.name === stepName);
                    const error = workflowErrorForStep(workflow.name, stepName);

                    if (step) {
                        openDrawer(`${stepName} error`, workflow.name, workflowStepErrorDetail(workflow, step, error));
                    }
                }

                return;
            }

            const routeTarget = event.target.closest("[data-go]");
            if (routeTarget) {
                showPage(routeTarget.dataset.go);
                globalSearchShell.classList.remove("open");
            }

            if (!event.target.closest("#global-search-shell")) {
                globalSearchShell.classList.remove("open");
            }

            const executionRow = event.target.closest("[data-execution]");
            if (executionRow) {
                const execution = state.executions.find((item) => item.id === executionRow.dataset.execution);
                if (execution) openDrawer(`Execution ${execution.id}`, execution.workflow, executionDetail(execution));
            }

            const errorRow = event.target.closest("[data-error]");
            if (errorRow) {
                const error = state.errors[Number(errorRow.dataset.error)];
                if (error) openDrawer(error.name, error.message, errorDetail(error));
            }

            const traceRow = event.target.closest("[data-trace]");
            if (traceRow) {
                const trace = state.traces.find((item) => item.id === traceRow.dataset.trace);
                if (trace) {
                    // Track selected trace so renderTraces() preserves it on refresh
                    state._selectedTraceId = trace.id;
                    // Highlight selected row
                    document.querySelectorAll("[data-trace]").forEach(r => r.classList.remove("selected-row"));
                    traceRow.classList.add("selected-row");
                    renderTraceGraph(trace);
                    openDrawer(`Trace ${trace.id}`, `${trace.method} ${trace.path}`, traceDetail(trace));
                }
            }

            const pinButton = event.target.closest("[data-toggle-pin]");
            if (pinButton) {
                event.stopPropagation();
                const workflow = state.workflows.find((item) => item.name === pinButton.dataset.togglePin);

                if (workflow) {
                    const pinnedCount = state.workflows.filter((item) => item.pinned).length;
                    if (!workflow.pinned && pinnedCount >= 4) {
                        alert("You can pin up to 4 workflows.");
                        return;
                    }

                    workflow.pinned = !workflow.pinned;
                    savePinnedWorkflowNames();
                    renderWorkflows();
                    return;
                }
            }

            const workflowRow = event.target.closest("[data-workflow]");
            if (workflowRow) {
                const workflow = state.workflows.find((item) => item.name === workflowRow.dataset.workflow);
                if (workflow) {
                    const execution = latestExecutionForWorkflow(workflow.name);
                    openDrawer(workflow.name, execution ? `latest execution ${execution.id}` : `version ${workflow.version}`, workflowDetail(workflow));
                }
            }

            const toggle = event.target.closest("[data-toggle-flag]");
            if (toggle) {
                event.stopPropagation();
                const flag = state.flags.find((item) => item.key === toggle.dataset.toggleFlag);
                if (flag) {
                    const nextEnabled = !flag.enabled;

                    try {
                        const { flag: updatedFlag } = await apiRequest(`flags/${encodeURIComponent(flag.key)}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                                enabled: nextEnabled,
                                changedBy: "dashboard",
                            }),
                        });
                        Object.assign(flag, normalizeFlag(updatedFlag));
                    }
                    catch (error) {
                        if (state.apiBacked) {
                            alert(error instanceof Error ? error.message : "Could not update feature flag.");
                            return;
                        }

                        flag.enabled = nextEnabled;
                    }

                    renderFlags();
                }
            }

            const deleteFlag = event.target.closest("[data-delete-flag]");
            if (deleteFlag) {
                event.stopPropagation();
                const flagKey = deleteFlag.dataset.deleteFlag;

                try {
                    await apiRequest(`flags/${encodeURIComponent(flagKey)}`, {
                        method: "DELETE",
                        body: JSON.stringify({ changedBy: "dashboard" }),
                    });
                }
                catch (error) {
                    if (state.apiBacked) {
                        alert(error instanceof Error ? error.message : "Could not delete feature flag.");
                        return;
                    }
                }

                state.flags = state.flags.filter((item) => item.key !== flagKey);
                renderFlags();
            }

            const flagRow = event.target.closest("[data-flag]");
            if (flagRow && !event.target.closest("[data-toggle-flag]") && !event.target.closest("[data-delete-flag]")) {
                const flag = state.flags.find((item) => item.key === flagRow.dataset.flag);
                if (flag) {
                    openDrawer(escapeHtml(flag.key), escapeHtml(flag.description || "Feature flag"), `
                        <div class="field-grid" style="margin-bottom:16px">
                            <div class="field"><div class="field-label">Key</div><div class="field-value mono">${escapeHtml(flag.key)}</div></div>
                            <div class="field"><div class="field-label">Status</div><div class="field-value">${flag.enabled ? '<span class="badge ok"><span class="dot"></span>enabled</span>' : '<span class="badge bad"><span class="dot"></span>disabled</span>'}</div></div>
                            <div class="field"><div class="field-label">Rules</div><div class="field-value mono">${escapeHtml(flag.rules)}</div></div>
                            <div class="field"><div class="field-label">Changed by</div><div class="field-value mono">${escapeHtml(flag.changedBy || '-')}</div></div>
                        </div>
                        <div style="margin-bottom:16px">
                            <div class="field-label" style="margin-bottom:8px">Rollout percentage</div>
                            <div style="display:flex;align-items:center;gap:12px">
                                <input id="drawer-rollout-slider" type="range" min="0" max="100" value="${escapeHtml(flag.rollout)}" style="flex:1;accent-color:var(--indigo)">
                                <input id="drawer-rollout-input" type="number" min="0" max="100" value="${escapeHtml(flag.rollout)}" class="input" style="width:70px;text-align:center">
                                <span class="muted" style="font-size:12px">%</span>
                            </div>
                            <div class="bar" style="margin-top:10px"><div id="drawer-rollout-bar" class="bar-fill" style="width:${escapeHtml(flag.rollout)}%"></div></div>
                        </div>
                        <button id="drawer-save-rollout" class="button" type="button" style="width:100%">Save rollout %</button>
                        <span id="drawer-rollout-status" class="setting-note" style="display:block;margin-top:8px"></span>
                    `);

                    const slider = document.getElementById("drawer-rollout-slider");
                    const numInput = document.getElementById("drawer-rollout-input");
                    const barEl = document.getElementById("drawer-rollout-bar");
                    const syncUI = (val) => { slider.value = val; numInput.value = val; barEl.style.width = val + "%"; };
                    slider.addEventListener("input", () => syncUI(slider.value));
                    numInput.addEventListener("input", () => syncUI(Math.min(100, Math.max(0, Number(numInput.value)))));

                    document.getElementById("drawer-save-rollout").addEventListener("click", async () => {
                        const pct = Math.min(100, Math.max(0, Number(numInput.value)));
                        const statusEl = document.getElementById("drawer-rollout-status");
                        statusEl.textContent = "saving...";
                        statusEl.className = "setting-note";
                        try {
                            const { flag: updated } = await apiRequest(`flags/${encodeURIComponent(flag.key)}`, {
                                method: "PATCH",
                                body: JSON.stringify({ rolloutPercentage: pct, changedBy: "dashboard" }),
                            });
                            Object.assign(flag, normalizeFlag(updated));
                            statusEl.textContent = "saved \u2713";
                            statusEl.className = "setting-note status-ok";
                            renderFlags();
                        } catch (err) {
                            statusEl.textContent = err.message || "failed";
                            statusEl.className = "setting-note status-missing";
                        }
                    });
                }
            }
        });

        loadSavedGroqCredentials();
        loadDashboardData();
