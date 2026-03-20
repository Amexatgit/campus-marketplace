let products = JSON.parse(localStorage.getItem("products")) || [];
let selectedIndex = localStorage.getItem("selectedProduct");

let product = products[selectedIndex];

let container = document.getElementById("productDetails");

if (product) {
  container.innerHTML = `
    <div class="col-md-6">
      <img src="${product.image}" class="img-fluid rounded">
    </div>

    <div class="col-md-6">
      <h2>${product.title}</h2>
      <h4 class="text-success">₹${product.price}</h4>
      <p class="mt-3">${product.description || "No description available"}</p>

      <button class="btn btn-dark mt-3">Contact Seller</button>
    </div>
  `;
} else {
  container.innerHTML = "<p>Product not found</p>";
}
