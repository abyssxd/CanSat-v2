/***************************************
 * Global Navbar Initialization
 ***************************************/
async function initializeNavbar() {
  // Use an absolute path since our server now serves config files at /config/*
  const response = await fetch("/config/navbar.json");
  if (!response.ok) {
    console.error("Error loading navbar config:", response.statusText);
    return;
  }
  const navConfig = await response.json();
  const sidebarLinks = document.getElementById("sidebar-links");
  sidebarLinks.innerHTML = "";

  if (Array.isArray(navConfig.items)) {
    navConfig.items.forEach(item => {
      if (item.visible) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.link;
        a.textContent = item.name;
        if (item.external) {
          a.target = "_blank";
        }
        li.appendChild(a);
        sidebarLinks.appendChild(li);
      }
    });
  } else {
    console.error("Navbar configuration is missing or invalid.");
  }
}
