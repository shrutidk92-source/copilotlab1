document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep default placeholder)
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants markup: badge + email list, or empty note
        const participants = details.participants || [];
        let participantsHtml = "";
        if (participants.length > 0) {
          const items = participants
            .map((p) => {
              // derive simple initials from the email local-part
              const local = (p.split("@")[0] || "").replace(/[^\w.-]/g, "");
              const initials = local
                .split(/[\.\-_]/)
                .map((s) => (s[0] || "").toUpperCase())
                .join("")
                .slice(0, 2);
              // include a delete button that will call the unregister endpoint
              return `<li class="participant-item"><span class="participant-badge">${initials ||
                "?"}</span><span class="participant-email">${p}</span><button class="participant-delete" data-activity="${name}" data-email="${p}" title="Remove participant">🗑️</button></li>`;
            })
            .join("");

          participantsHtml = `
            <div class="participants-section">
              <strong>Participants</strong>
              <ul class="participants-list">${items}</ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants-section">
              <strong>Participants</strong>
              <p class="no-participants">No participants yet</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so the new participant shows immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click handler for participant delete buttons
  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target || !target.classList.contains("participant-delete")) return;

    const activity = target.dataset.activity;
    const email = target.dataset.email;

    if (!activity || !email) return;

    // optional simple confirmation
    const ok = confirm(`Remove ${email} from ${activity}?`);
    if (!ok) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const body = await resp.json();

      if (resp.ok) {
        messageDiv.textContent = body.message || "Participant removed";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        // Refresh list to reflect change
        fetchActivities();
      } else {
        messageDiv.textContent = body.detail || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      // hide message after a few seconds
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    } catch (err) {
      messageDiv.textContent = "Failed to remove participant";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", err);
    }
  });

  // Initialize app
  fetchActivities();
});
