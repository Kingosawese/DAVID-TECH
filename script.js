const WHATSAPP_NUMBER = "2347015627476";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const productGrid = document.getElementById("productGrid");
const statusText = document.getElementById("status");

let selectedBrand = "All";
let searchNumber = 0;

const colours = [
    { name: "Black", code: "#171717" },
    { name: "White", code: "#eeeeee" },
    { name: "Blue", code: "#2878c8" },
    { name: "Gold", code: "#c9a45c" },
    { name: "Silver", code: "#bfc5ce" },
    { name: "Purple", code: "#8054a8" },
    { name: "Green", code: "#34845a" }
];

// BRAND BUTTONS
document.querySelectorAll(".category").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".category").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        selectedBrand = button.dataset.brand;

        searchInput.value = "";
        productGrid.innerHTML = "";

        statusText.textContent =
            selectedBrand === "All"
                ? "Search for a phone model."
                : `Search for a ${selectedBrand} model.`;

        searchInput.focus();
    });
});

// DETECT PHONE BRAND
function detectBrand(query) {
    const value = query.toLowerCase();

    if (value.includes("iphone") || value.includes("apple")) {
        return "iPhone";
    }

    if (
        value.includes("samsung") ||
        value.includes("galaxy")
    ) {
        return "Samsung";
    }

    if (
        value.includes("tecno") ||
        value.includes("camon") ||
        value.includes("spark") ||
        value.includes("phantom") ||
        value.includes("pop ")
    ) {
        return "Tecno";
    }

    return selectedBrand;
}

// SEARCH BUTTON
searchButton.addEventListener("click", searchPhone);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchPhone();
    }
});

// BUILD SEARCH TERM
function buildSearchTerm(query, brand) {
    const value = query.trim();

    if (brand === "iPhone" &&
        !value.toLowerCase().includes("iphone")) {
        return `Apple iPhone ${value}`;
    }

    if (brand === "Samsung" &&
        !value.toLowerCase().includes("samsung") &&
        !value.toLowerCase().includes("galaxy")) {
        return `Samsung Galaxy ${value}`;
    }

    if (brand === "Tecno" &&
        !value.toLowerCase().includes("tecno")) {
        return `Tecno ${value}`;
    }

    return value;
}

// SEARCH ONLINE FOR PHONE IMAGES
async function searchPhone() {
    const originalQuery = searchInput.value.trim();

    if (!originalQuery) {
        statusText.textContent = "Please type a phone model.";
        return;
    }

    const brand = detectBrand(originalQuery);

    if (selectedBrand !== "All" && brand !== selectedBrand) {
        statusText.textContent =
            `You selected ${selectedBrand}. Please search for a ${selectedBrand} model.`;
        return;
    }

    if (brand === "All") {
        statusText.textContent =
            "Please choose iPhones, Samsung or Tecno before searching.";
        return;
    }

    const query = buildSearchTerm(originalQuery, brand);
    const currentSearch = ++searchNumber;

    productGrid.innerHTML = "";
    statusText.textContent = `Searching online for ${query}...`;
    searchButton.disabled = true;

    try {
        const params = new URLSearchParams({
            action: "query",
            generator: "search",
            gsrsearch: `${query} smartphone`,
            gsrnamespace: "6",
            gsrlimit: "20",
            prop: "imageinfo",
            iiprop: "url|extmetadata",
            iiurlwidth: "800",
            iiextmetadatafilter: "LicenseShortName|Artist",
            format: "json",
            origin: "*"
        });

        const response = await fetch(
            `https://commons.wikimedia.org/w/api.php?${params}`
        );

        if (!response.ok) {
            throw new Error("Image search failed.");
        }

        const data = await response.json();

        if (currentSearch !== searchNumber) return;

        if (data.error) {
            throw new Error(data.error.info || "Image API error");
        }

        const pages = Object.values(data.query?.pages || {});

        // Prefer results whose image title includes the model words.
        const queryWords = originalQuery
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 1);

        const matches = pages
            .filter(page => page.imageinfo?.[0]?.thumburl)
            .map(page => {
                const title = page.title.toLowerCase();

                const score = queryWords.reduce((total, word) => {
                    return total + (title.includes(word) ? 1 : 0);
                }, 0);

                return { page, score };
            })
            .filter(item => item.score >= Math.min(2, queryWords.length))
            .sort((a, b) => b.score - a.score);

        if (matches.length === 0) {
            statusText.textContent =
                `Sorry, no matching online picture was found for ${originalQuery}. Try the full model name.`;
            return;
        }

        statusText.textContent =
            `Found ${matches.length} matching image result(s) for ${originalQuery}.`;

        matches.slice(0, 4).forEach(item => {
            createProductCard(item.page, originalQuery, brand);
        });

    } catch (error) {
        console.error(error);

        if (currentSearch === searchNumber) {
            statusText.textContent =
                "Unable to load pictures right now. Check your internet connection and try again.";
        }
    } finally {
        if (currentSearch === searchNumber) {
            searchButton.disabled = false;
        }
    }
}

// CREATE PRODUCT CARD
function createProductCard(page, model, brand) {
    const imageInfo = page.imageinfo[0];

    const card = document.createElement("article");
    card.className = "product-card";

    const imageBox = document.createElement("div");
    imageBox.className = "product-image";

    const image = document.createElement("img");
    image.src = imageInfo.thumburl;
    image.alt = model;
    image.loading = "lazy";

    image.addEventListener("error", () => {
        imageBox.innerHTML = "";
        imageBox.textContent = "Image unavailable";
        imageBox.style.color = "#263b59";
    });

    imageBox.appendChild(image);

    const info = document.createElement("div");
    info.className = "product-info";

    const brandName = document.createElement("p");
    brandName.className = "brand-name";
    brandName.textContent = brand;

    const title = document.createElement("h3");
    title.textContent = model;

    const description = document.createElement("p");
    description.textContent =
        "Contact us to confirm availability and colours.";

    const colourTitle = document.createElement("p");
    colourTitle.className = "colour-title";
    colourTitle.textContent = "Choose your preferred colour:";

    const colourBox = document.createElement("div");
    colourBox.className = "colours";

    const selectedText = document.createElement("p");
    selectedText.className = "selected-colour";
    selectedText.textContent = "Selected colour: Black";

    let selectedColour = "Black";

    colours.forEach((colour, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "colour";
        button.style.backgroundColor = colour.code;
        button.title = colour.name;
        button.setAttribute("aria-label", colour.name);

        if (index === 0) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            selectedColour = colour.name;
            selectedText.textContent =
                `Selected colour: ${selectedColour}`;

            colourBox.querySelectorAll(".colour").forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
        });

        colourBox.appendChild(button);
    });

    const orderButton = document.createElement("a");
    orderButton.className = "order-btn";
    orderButton.href = "#";
    orderButton.textContent = "Enquire on WhatsApp";

    orderButton.addEventListener("click", event => {
        event.preventDefault();

        const message =
            `Hello DAVID TECH! I am interested in the ${model}. My preferred colour is ${selectedColour}. Please confirm availability and the details.`;

        const url =
            `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

        window.open(url, "_blank", "noopener");
    });

    const source = document.createElement("div");
    source.className = "image-source";

    const sourceLink = document.createElement("a");
    sourceLink.href = imageInfo.descriptionurl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener";
    sourceLink.textContent = "View image source and licence";

    source.appendChild(sourceLink);

    info.append(
        brandName,
        title,
        description,
        colourTitle,
        colourBox,
        selectedText,
        orderButton,
        source
    );

    card.append(imageBox, info);
    productGrid.appendChild(card);
}
document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
        const brand = card.dataset.brand;

        if (brand === "Accessories") {
            selectedBrand = "Accessories";
            searchInput.placeholder = "Search chargers, earbuds, power banks...";
        } else {
            selectedBrand = brand;
            searchInput.placeholder = `Search ${brand} models...`;
        }

        searchInput.value = "";

        document.querySelectorAll(".category").forEach(button => {
            button.classList.remove("active");
        });

        const matchingButton = document.querySelector(
            `.category[data-brand="${brand}"]`
        );

        if (matchingButton) {
            matchingButton.classList.add("active");
        }

        productGrid.innerHTML = "";
        statusText.textContent = `Search for a ${brand} product above.`;

        document.getElementById("shop").scrollIntoView({
            behavior: "smooth"
        });

        searchInput.focus();
    });
});