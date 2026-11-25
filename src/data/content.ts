import { DEFAULT_BRANCHES } from "../../convex/lib/branchDefaults";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/currencies";
import {
  staticFaqId,
  staticMenuItemId,
  staticStatId,
  staticTeamMemberId,
} from "@/lib/entityIds";
import { getMenuStockImageUrl } from "./menuStockImages";
import { SITE_MEDIA } from "./siteAssets";

export type MenuCategory =
  | "signature"
  | "lattes"
  | "tea-matcha"
  | "bakery-dessert"
  | "breakfast";

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category: MenuCategory;
  featured: boolean;
  sortOrder: number;
  imageUrl?: string;
  availableIn?: readonly (typeof BRANCHES)[number]["id"][];
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  sortOrder: number;
}

export interface Stat {
  _id: string;
  value: number;
  suffix: string;
  label: string;
  sortOrder: number;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export const SITE = {
  name: "Kafe Eman",
  tagline: "Handcrafted coffee, warm ambiance, and moments worth remembering.",
  description:
    "Kafe Eman is a premium café experience crafted with precision—showcasing the menu, the story, and the atmosphere in a warm, memorable digital experience.",
  url: "https://kafe-eman.example",
};

export const MENU_CATEGORIES: {
  id: MenuCategory;
  label: string;
  sectionLabel: string;
}[] = [
  { id: "signature", label: "Signature Coffee", sectionLabel: "SIGNATURE COFFEE" },
  { id: "lattes", label: "Speciality Lattes", sectionLabel: "SPECIALTY LATTES" },
  { id: "tea-matcha", label: "Tea & Matcha", sectionLabel: "TEA & MATCHA" },
  { id: "bakery-dessert", label: "Bakery & Desserts", sectionLabel: "BAKERY & DESSERTS" },
  { id: "breakfast", label: "Breakfast & Bites", sectionLabel: "BREAKFAST & LIGHT BITES" },
];

/** Short, friendly copy shown under each menu section heading. */
export const MENU_CATEGORY_HINTS: Record<MenuCategory, string> = {
  signature: "Espresso classics and house favourites to start your day.",
  lattes: "Smooth, creamy lattes — pick your flavour and enjoy.",
  "tea-matcha": "Teas, matcha, and calm sips for every mood.",
  "bakery-dessert": "Fresh pastries and sweets baked for the café.",
  breakfast: "Morning plates and light bites, served until midday.",
};

/** Ref home highlights — titles only on published site */
export const HIGHLIGHTS = [
  { title: "Elegant Ambience" },
  { title: "Handcrafted Coffee" },
  { title: "Skilled Baristas" },
  { title: "Seasonal Specials" },
];

export const HOME_STATS = [
  { value: 15, suffix: "K+", label: "Cups served to happy guests every month." },
  { value: 8, suffix: "+", label: "Of passion for coffee & rooted hospitality." },
  { value: 98, suffix: "%", label: "Loyal guests inspired by our experience." },
];

export const WORKSPACE_FEATURES = [
  {
    title: "Great coffee",
    subtitle: "Work Friendly",
    heading: "A space where productivity & ideas grow naturally",
    description:
      "From morning sessions to quiet afternoons, our café offers an atmosphere of comfort and calm where ideas flow naturally & effortlessly.",
  },
  {
    title: "Free Power Access",
    subtitle: "Calm Space",
    heading: "Comfortable spaces designed for productive work sessions",
    description:
      "Whether you're working remotely, studying, or meeting casually, our thoughtfully designed space supports focus, comfort, and distraction-free productivity.",
  },
];

export const TESTIMONIALS = [
  {
    text: "The café has a calm and inviting atmosphere, perfect for working or relaxing. The seating is comfortable, the coffee is excellent, and the space always feels thoughtfully organized.",
    author: "Sophia Martinez",
    role: "Weekend Player",
    image: SITE_MEDIA.testimonials[0].src,
    imageWidth: SITE_MEDIA.testimonials[0].width,
    imageHeight: SITE_MEDIA.testimonials[0].height,
  },
  {
    text: "A great place to work for a few hours. The environment is peaceful, Wi-Fi is reliable, and the staff is welcoming. It's easy to settle in and stay.",
    author: "Daniel Foster",
    role: "Remote Designer",
    image: SITE_MEDIA.testimonials[1].src,
    imageWidth: SITE_MEDIA.testimonials[1].width,
    imageHeight: SITE_MEDIA.testimonials[1].height,
  },
  {
    text: "Comfortable seating, calm surroundings, and great coffee make this my go-to workspace. It's easy to focus, and the atmosphere always feels relaxed.",
    author: "Cairo Leo",
    role: "Coffee Enthusiast",
    image: SITE_MEDIA.testimonials[2].src,
    imageWidth: SITE_MEDIA.testimonials[2].width,
    imageHeight: SITE_MEDIA.testimonials[2].height,
  },
  {
    text: "The ambience is warm and comfortable, ideal for casual meetings or quiet time. The coffee quality is consistent, and the overall experience feels curated.",
    author: "Emily Thompson",
    role: "Freelance Writer",
    image: SITE_MEDIA.testimonials[3].src,
    imageWidth: SITE_MEDIA.testimonials[3].width,
    imageHeight: SITE_MEDIA.testimonials[3].height,
  },
];

export const CONTACT_INFO = {
  location: "22-A Bawah, Taman Koperasi, Jalan Tun Razak, Taman Mutiara, 05200 Alor Setar, Kedah.",
  phone: "+001 234 567 890",
  email: "kafeeman@gmail.com",
  hours: "9:00AM -11:00PM",
};

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Get In Touch", href: "/contact" },
];

export const BRANCHES = DEFAULT_BRANCHES.map(({ slug, ...branch }) => ({ id: slug, ...branch }));

export const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Get In Touch", href: "/contact" },
  { label: "Reservation", href: "/reservation" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export const ABOUT_COPY = {
  heroTitle: "The Taste Story",
  heroSubtitle: "Guided by quality, inspired by tradition, perfected by detail.",
  intro:
    "Rooted in a passion for great coffee, we set out to serve the perfect cup in a space defined by warmth & flavor.",
  statsTitle: "Trusted by thousands. Precision in every cup.",
  statsEyebrow: "Excellence in Numbers",
  visionTitle: "Our Vision & Purpose",
  visionText:
    "Our mission is to create a refined experience where exceptional coffee, elegant ambience, and thoughtful hospitality come together. Every detail is carefully considered to ensure that our guests feel inspired with every visit.",
  beansTitle: "The Finest Premium Beans, Carefully Selected",
  beansText:
    "We partner with trusted farms across the globe to source our premium beans grown with care and sustainability within mind. Each origin is carefully selected for its distinct character, aroma, and depth.Through responsible sourcing and precise roasting, we ensure that every cup delivers exceptional flavor while supporting the communities behind it everywhere.",
  beansTags: ["Global Origins", "Ethical Farms", "Freshly Roasted", "The Artisans"],
  teamTitle: "Passionate Hands Behind Every Cup",
};

const STATIC_MENU_ITEMS_BASE: Omit<MenuItem, "imageUrl">[] = [
  { _id: staticMenuItemId("signature-espresso"), name: "Signature Espresso", description: "Rich, bold espresso with a velvety crema.", price: 6.5, category: "signature", featured: true, sortOrder: 1, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("velvet-caramel-latte"), name: "Velvet Caramel Latte", description: "Silky steamed milk with caramel sweetness.", price: 8.9, category: "signature", featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("classic-cappuccino"), name: "Classic Cappuccino", description: "Balanced espresso, steamed milk, and foam.", price: 7.8, category: "signature", featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("artisan-cold-brew"), name: "Artisan Cold Brew", description: "Slow-steeped cold brew, smooth and crisp.", price: 25, category: "signature", featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas"] },
  { _id: staticMenuItemId("vanilla-cloud-latte"), name: "Vanilla Cloud Latte", description: "Vanilla-infused latte topped with airy foam.", price: 8.4, category: "lattes", featured: true, sortOrder: 1, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("hazelnut-delight"), name: "Hazelnut Delight", description: "Nutty hazelnut latte with a warm finish.", price: 8.9, category: "lattes", featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("rose-almond-latte"), name: "Rose Almond Latte", description: "Floral rose notes with almond creaminess.", price: 15, category: "lattes", featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas"] },
  { _id: staticMenuItemId("honey-cinnamon-latte"), name: "Honey Cinnamon Latte", description: "Honey sweetness with a cinnamon spice lift.", price: 9.2, category: "lattes", featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("matcha-harmony"), name: "Matcha Harmony", description: "Ceremonial matcha blended with creamy milk.", price: 9.8, category: "tea-matcha", featured: true, sortOrder: 1, availableIn: ["alor-setar", "uum-sintok"] },
  { _id: staticMenuItemId("earl-grey-supreme"), name: "Earl Grey Supreme", description: "Bergamot black tea, fragrant and refined.", price: 12, category: "tea-matcha", featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("chamomile-blossom"), name: "Chamomile Blossom", description: "Calming chamomile infusion, naturally sweet.", price: 6.8, category: "tea-matcha", featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("jasmine-green-tea"), name: "Jasmine Green Tea", description: "Delicate jasmine aroma with green tea clarity.", price: 6.5, category: "tea-matcha", featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("blueberry-muffin"), name: "Blueberry Muffin", description: "Buttery muffin with baked blueberry bursts.", price: 6.2, category: "bakery-dessert", featured: true, sortOrder: 1, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("butter-croissant"), name: "Butter Croissant", description: "Flaky, golden croissant with a soft center.", price: 5.9, category: "bakery-dessert", featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
  { _id: staticMenuItemId("classic-cheesecake"), name: "Classic Cheesecake", description: "Creamy cheesecake with a crisp biscuit base.", price: 8.9, category: "bakery-dessert", featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas"] },
  { _id: staticMenuItemId("tiramisu-classico"), name: "Tiramisu Classico", description: "Espresso-soaked layers with cocoa dusting.", price: 9.5, category: "bakery-dessert", featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas"] },
  { _id: staticMenuItemId("classic-omelette-plate"), name: "Classic Omelette Plate", description: "Fluffy omelette served with fresh sides.", price: 14.9, category: "breakfast", featured: false, sortOrder: 1, availableIn: ["alor-setar"] },
  { _id: staticMenuItemId("cheese-croissant-sandwich"), name: "Cheese Croissant Sandwich", description: "Warm croissant sandwich with melted cheese.", price: 11.9, category: "breakfast", featured: false, sortOrder: 2, availableIn: ["alor-setar", "uum-sintok"] },
  { _id: staticMenuItemId("avocado-toast"), name: "Avocado Toast", description: "Smashed avocado on toast with seasonal garnish.", price: 13.5, category: "breakfast", featured: false, sortOrder: 3, availableIn: ["alor-setar", "uum-sintok"] },
  { _id: staticMenuItemId("truffle-scrambled-eggs"), name: "Truffle Scrambled Eggs", description: "Creamy eggs finished with truffle aroma.", price: 13.5, category: "breakfast", featured: false, sortOrder: 4, availableIn: ["alor-setar"] },
];

export const STATIC_MENU_ITEMS: MenuItem[] = STATIC_MENU_ITEMS_BASE.map((item) => ({
  ...item,
  imageUrl: getMenuStockImageUrl(item.name, item.category),
}));

export const STATIC_TEAM: TeamMember[] = [
  { _id: staticTeamMemberId("james-rodriguez"), name: "James Rodriguez", role: "Head Pastry Chef", sortOrder: 1 },
  { _id: staticTeamMemberId("sophia-patel"), name: "Sophia Patel", role: "Executive Chef", sortOrder: 2 },
  { _id: staticTeamMemberId("michelle-taylor"), name: "Michelle Taylor", role: "Head Barista", sortOrder: 3 },
  { _id: staticTeamMemberId("david-chen"), name: "David Chen", role: "Commis Chef", sortOrder: 4 },
  { _id: staticTeamMemberId("amara-koni"), name: "Amara Koni", role: "Sous Chef", sortOrder: 5 },
  { _id: staticTeamMemberId("marcus-williams"), name: "Marcus Williams", role: "Culinary Strategist", sortOrder: 6 },
];

export const STATIC_ABOUT_STATS: Stat[] = [
  { _id: staticStatId("cups-served"), value: 10, suffix: "K+", label: "Cups Served", sortOrder: 4 },
  { _id: staticStatId("loyal-customers"), value: 5, suffix: "K+", label: "Loyal Customers", sortOrder: 5 },
  { _id: staticStatId("years-operation"), value: 8, suffix: "+", label: "Years In Operation", sortOrder: 6 },
  { _id: staticStatId("global-origins"), value: 12, suffix: "+", label: "Global Origins", sortOrder: 7 },
];

/** Exact FAQ copy from ref published bundle */
export const STATIC_FAQS: Faq[] = [
  {
    _id: staticFaqId("reserve-table"),
    question: "Can I reserve a table in advance?",
    answer: "Absolutely. You can reserve your table online in just a few simple steps.",
    sortOrder: 1,
  },
  {
    _id: staticFaqId("dairy-free-vegan"),
    question: "Do you serve dairy-free and vegan options?",
    answer: "Yes, we offer oat, almond, soy, and other plant-based alternatives.",
    sortOrder: 2,
  },
  {
    _id: staticFaqId("bean-sourcing"),
    question: "Where do you source your coffee beans from?",
    answer: "We partner with trusted farms that follow sustainable practices.",
    sortOrder: 3,
  },
  {
    _id: staticFaqId("work-meetings"),
    question: "Can I work or hold meetings at the café?",
    answer: "Yes, our space is designed for both casual work sessions and meetings.",
    sortOrder: 4,
  },
  {
    _id: staticFaqId("non-coffee"),
    question: "Are non-coffee beverages available?",
    answer:
      "Yes, we offer a variety of non-coffee beverages including teas, fresh juices, smoothies, and specialty drinks to suit every preference.",
    sortOrder: 5,
  },
];

export const HERO_IMAGE = SITE_MEDIA.footer.src;

export function formatPrice(price: number, currency: string = DEFAULT_CURRENCY) {
  return formatMoney(price, currency);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
