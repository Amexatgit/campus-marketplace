const API_URL = "http://localhost:3000/api";

function formatPrice(priceStr) {
  const price = parseFloat(priceStr);
  if (isNaN(price)) return "₹0";
  return `₹${price.toLocaleString("en-IN")}`;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("campus_session"));
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavUI();

  if (document.getElementById("product-list")) initHome();
  if (document.getElementById("add-product-form")) initAddPage();
  if (document.getElementById("product-details")) initProductPage();
  if (document.getElementById("login-form")) initLoginPage();
});

function updateNavUI() {
  const user = getCurrentUser();
  const navLinks = document.querySelector(".navbar-nav");

  if (user && navLinks) {
    const loginBtn = navLinks.querySelector('a[href="login.html"]');
    if (loginBtn) {
      loginBtn.textContent = "Logout";
      loginBtn.href = "#";
      loginBtn.classList.replace("btn-outline-primary", "btn-outline-danger");
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("campus_session");
        window.location.reload();
      });
    }
  }
}

async function initHome() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    renderProducts(products);

    const searchBar = document.getElementById("search-bar");
    searchBar.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredProducts = products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm),
      );
      renderProducts(filteredProducts);
    });
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function renderProducts(products) {
  const container = document.getElementById("product-list");
  const emptyState = document.getElementById("empty-state");
  container.innerHTML = "";

  if (products.length === 0) {
    emptyState.classList.remove("d-none");
    return;
  }
  emptyState.classList.add("d-none");

  // Notice we added 'index' to the forEach loop
  products.forEach((product, index) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-lg-4 col-xl-3";

    // Calculate a dynamic delay based on the card's position
    const delay = index * 0.1;

    col.innerHTML = `
            <a href="product.html?id=${product.id}" class="card product-card border-0 shadow-sm rounded-4 h-100" style="animation-delay: ${delay}s;">
                <img src="${product.image}" class="card-img-top" alt="${product.title}" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                <div class="card-body p-4">
                    <h5 class="card-title text-dark">${product.title}</h5>
                    <p class="card-text text-muted small text-truncate">${product.description}</p>
                    <div class="price mt-3">${formatPrice(product.price)}</div>
                </div>
            </a>
        `;
    container.appendChild(col);
  });
}

function initAddPage() {
  const user = getCurrentUser();
  if (!user) {
    alert("You must be logged in to post an item.");
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("add-product-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("image");
    const file = fileInput.files[0];
    if (!file) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "Uploading...";
    submitBtn.disabled = true;

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Image = reader.result;

      const newProduct = {
        title: document.getElementById("title").value.trim(),
        price: document.getElementById("price").value.trim(),
        image: base64Image,
        description: document.getElementById("description").value.trim(),
        user_id: user.id,
      };

      try {
        const response = await fetch(`${API_URL}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProduct),
        });

        if (!response.ok) throw new Error("Failed to upload");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error adding product:", error);
        alert("Failed to upload product. Image might be too large.");
        submitBtn.textContent = "Post Listing";
        submitBtn.disabled = false;
      }
    };

    reader.readAsDataURL(file);
  });
}

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const container = document.getElementById("product-details");
  const currentUser = getCurrentUser();

  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    if (!response.ok) throw new Error("Product not found");
    const product = await response.json();

    const isOwner = currentUser && currentUser.id === product.user_id;
    const deleteBtnHtml = isOwner
      ? `<button id="delete-btn" class="btn btn-outline-danger rounded-pill px-4"><i class="fa-solid fa-trash"></i></button>`
      : "";

    container.innerHTML = `
            <div class="row g-0">
                <div class="col-md-6">
                    <img src="${product.image}" alt="${product.title}" class="product-detail-img" onerror="this.src='https://placehold.co/800x800?text=No+Image'">
                </div>
                <div class="col-md-6 d-flex flex-column p-4 p-lg-5">
                    <h2 class="fw-bold mb-2">${product.title}</h2>
                    <h3 class="text-primary fw-bold mb-4">${formatPrice(product.price)}</h3>
                    <h5 class="fw-semibold mb-2">Description</h5>
                    <p class="text-muted mb-5" style="line-height: 1.7;">${product.description}</p>
                    <div class="mt-auto d-flex gap-3">
                        <a href="mailto:${product.seller_email}?subject=Interested in your CampusMart item: ${product.title}" class="btn btn-primary flex-grow-1 rounded-pill py-3 fw-medium d-flex align-items-center justify-content-center text-decoration-none">
                            <i class="fa-solid fa-envelope me-2"></i>Contact Seller
                        </a>
                        ${deleteBtnHtml}
                    </div>
                </div>
            </div>
        `;

    if (isOwner) {
      document
        .getElementById("delete-btn")
        .addEventListener("click", async () => {
          if (confirm("Delete this listing?")) {
            await fetch(`${API_URL}/products/${productId}`, {
              method: "DELETE",
            });
            window.location.href = "index.html";
          }
        });
    }
  } catch (error) {
    container.innerHTML =
      '<div class="text-center py-5"><h4>Product not found.</h4><a href="index.html">Go home</a></div>';
  }
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  const toggleContainer = document.querySelector(".mt-4.text-muted.small");
  const formTitle = document.querySelector("h4");
  const submitBtn = document.querySelector('button[type="submit"]');
  let isLoginMode = true;

  toggleContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      isLoginMode = !isLoginMode;

      if (isLoginMode) {
        formTitle.textContent = "Welcome back";
        submitBtn.textContent = "Sign In";
        toggleContainer.innerHTML = `Don't have an account? <a href="#" class="text-primary text-decoration-none">Sign up</a>`;
      } else {
        formTitle.textContent = "Create an Account";
        submitBtn.textContent = "Sign Up";
        toggleContainer.innerHTML = `Already have an account? <a href="#" class="text-primary text-decoration-none">Sign in</a>`;
      }
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Please wait...";
    submitBtn.disabled = true;

    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    const endpoint = isLoginMode ? "/login" : "/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      localStorage.setItem("campus_session", JSON.stringify(data));
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}
