/* =====================================================================
   SRIAADHYA — Brand & Catalog Data
   Verbatim port of HTML/assets/js/data.js. Every id, price, name, foodType,
   bestseller flag and rating is unchanged.

   Hyperlocal food products store (Avinashi, Tirupur)
   NOTE: Bestseller products were not supplied at intake, so the catalog
   below uses realistic Tamil-Nadu-market DEMO products under the REAL
   categories the merchant provided. Swap via dashboard once onboarded.

   TODO[part-2]: delete this file once the real endpoints are wired.
   ===================================================================== */

import type { Brand, Category, Coupon, FoodType, Product, StoreHours, Testimonial, Variant } from '@/types';

export const BRAND: Brand = {
  name: 'SRIAADHYA',
  tagline: 'Innovation in Everyday Essentials',
  slogan: 'Bloom Like a Blossom',
  about:
    'We manufacture & distribute high-quality tissue products, farm-fresh button mushrooms, exotic vegetables, plant-based mock meat, dairy, sauces and delicious ready-to-eat frozen snacks. Serving retailers, wholesalers & HORECA businesses.',
  city: 'Avinashi, Tirupur',
  area: 'Avinashi',
  radiusKm: 10,
  deliveryTime: 30, // minutes
  minOrder: 0, // no minimum
  freeDeliveryAbove: null, // no free delivery
  deliveryNote: 'Delivery charge calculated per KM',
  baseDeliveryPerKm: 9, // ₹ per km (demo)
  whatsapp: '917092229777',
  phone: '+91 70922 29777',
  rating: 4.8,
  reviewCount: 1240,
  storeLat: 11.1925, // Avinashi approx
  storeLng: 77.268,
  isDemo: true,
};

/* ---- Static store hours (display only, backend enforces timing) ---- */
export const storeHoursDisplay: StoreHours = {
  Monday: '9:00 AM - 9:00 PM',
  Tuesday: '9:00 AM - 9:00 PM',
  Wednesday: '9:00 AM - 9:00 PM',
  Thursday: '9:00 AM - 9:00 PM',
  Friday: '9:00 AM - 9:30 PM',
  Saturday: '9:00 AM - 9:30 PM',
  Sunday: '10:00 AM - 6:00 PM',
};

/* ---- Categories (real, from merchant intake) ---- */
export const categories: Category[] = [
  { id: 'exotic-veggies', name: 'Exotic Veggies', icon: 'leaf', emoji: '🥦', tone: '#16A34A',
    img: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=400&fit=crop' },
  { id: 'dairy', name: 'Dairy Products', icon: 'milk', emoji: '🧀', tone: '#0EA5A4',
    img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop' },
  { id: 'mock-meat', name: 'Mock Meat', icon: 'sprout', emoji: '🌱', tone: '#15803D',
    img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop' },
  { id: 'sauces', name: 'Sauce & Mayo', icon: 'soup', emoji: '🥫', tone: '#E1AD01',
    img: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&h=400&fit=crop' },
  { id: 'samosas', name: 'Samosas', icon: 'triangle', emoji: '🥟', tone: '#CA8A04',
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop' },
  { id: 'rolls', name: 'Rolls & Snacks', icon: 'utensils', emoji: '🌯', tone: '#D97706',
    img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop' },
  { id: 'chicken-starters', name: 'Chicken Starters', icon: 'drumstick', emoji: '🍗', tone: '#B91C1C',
    img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop' },
  { id: 'seafood', name: 'Seafood', icon: 'fish', emoji: '🦐', tone: '#0369A1',
    img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop' },
];

interface POpts {
  rating?: number;
  reviews?: number;
  orderedTimes?: number;
  bestseller?: boolean;
  trending?: boolean;
  inStock?: boolean;
  desc?: string;
  variants?: Variant[];
}

/* ---- Helper to keep product objects compact ---- */
function P(
  id: string,
  catId: string,
  name: string,
  price: number,
  mrp: number,
  foodType: FoodType,
  unit: string,
  img: string,
  opts: POpts = {},
): Product {
  return {
    id, catId, name, price, mrp, foodType, unit,
    img: `https://images.unsplash.com/${img}?w=500&h=500&fit=crop`,
    rating: opts.rating || (4.2 + Math.round((id.length % 7) * 0.1 * 10) / 10 > 4.9 ? 4.7 : 4.3 + (id.length % 6) * 0.1),
    reviews: opts.reviews || (40 + (id.charCodeAt(id.length - 1) % 60)),
    orderedTimes: opts.orderedTimes || 0,
    bestseller: !!opts.bestseller,
    trending: !!opts.trending,
    inStock: opts.inStock !== false,
    desc: opts.desc || 'Premium quality, hygienically packed and quality-assured by SRIAADHYA. Ideal for home, retail & HORECA use.',
    variants: opts.variants || null,
  };
}

export const products: Product[] = [
  /* Exotic Veggies */
  P('EV01','exotic-veggies','Fresh Button Mushroom (200g)',65,80,'veg','200g','photo-1518977676601-b53f82aba655',{bestseller:true,orderedTimes:412,trending:true,variants:[{label:'200g',price:65},{label:'500g',price:150},{label:'1kg',price:280}]}),
  P('EV02','exotic-veggies','Broccoli (per pc)',55,70,'veg','250g','photo-1459411621453-7b03977f4bfc',{orderedTimes:188}),
  P('EV03','exotic-veggies','Coloured Capsicum Trio (3 pc)',90,120,'veg','450g','photo-1563565375-f3fdfdbefa83',{trending:true,orderedTimes:140}),
  P('EV04','exotic-veggies','Zucchini Green (2 pc)',70,90,'veg','400g','photo-1583687355032-89b902b7335f',{orderedTimes:96}),
  P('EV05','exotic-veggies','Baby Corn (250g)',45,60,'veg','250g','photo-1635774855536-9728f2610245',{bestseller:true,orderedTimes:260}),
  P('EV06','exotic-veggies','Cherry Tomato Punnet (200g)',60,75,'veg','200g','photo-1592924357228-91a4daadcfea',{orderedTimes:78}),
  P('EV07','exotic-veggies','Iceberg Lettuce (per pc)',65,85,'veg','300g','photo-1622205313162-be1d5712a43f',{orderedTimes:54}),

  /* Dairy */
  P('DA01','dairy','Fresh Paneer (200g)',85,100,'veg','200g','photo-1631452180519-c014fe946bc7',{bestseller:true,orderedTimes:520,trending:true,variants:[{label:'200g',price:85},{label:'500g',price:200}]}),
  P('DA02','dairy','Malai Curd (400g)',45,55,'veg','400g','photo-1571212515416-fef01fc43637',{orderedTimes:210}),
  P('DA03','dairy','Cheese Slices (10 pc)',120,150,'veg','200g','photo-1486297678162-eb2a19b0a32d',{orderedTimes:160}),
  P('DA04','dairy','Pure Cow Ghee (500ml)',320,380,'veg','500ml','photo-1631452180539-96aca7d48617',{bestseller:true,orderedTimes:300}),
  P('DA05','dairy','Mozzarella Block (200g)',165,200,'veg','200g','photo-1628088062854-d1870b4553da',{trending:true,orderedTimes:120}),
  P('DA06','dairy','Salted Butter (100g)',58,70,'veg','100g','photo-1589985270826-4b7bb135bc9d',{orderedTimes:90}),

  /* Mock Meat */
  P('MM01','mock-meat','Plant-Based Mock Chicken Chunks (250g)',180,220,'veg','250g','photo-1540420773420-3366772f4999',{bestseller:true,orderedTimes:340,trending:true}),
  P('MM02','mock-meat','Soya Mock Mutton Curry Cut (250g)',165,200,'veg','250g','photo-1604908176997-125f25cc6f3d',{orderedTimes:150}),
  P('MM03','mock-meat','Vegan Seekh Kebab (6 pc)',150,180,'veg','300g','photo-1529006557810-274b9b2fc783',{orderedTimes:118}),
  P('MM04','mock-meat','Plant Protein Nuggets (300g)',170,210,'veg','300g','photo-1562967914-608f82629710',{trending:true,orderedTimes:98}),
  P('MM05','mock-meat','Mock Fish Fingers (250g)',185,230,'veg','250g','photo-1599487488170-d11ec9c172f0',{orderedTimes:64}),

  /* Sauces & Mayo */
  P('SA01','sauces','Classic Veg Mayonnaise (250g)',75,95,'veg','250g','photo-1607013251379-e6eecfffe234',{bestseller:true,orderedTimes:480}),
  P('SA02','sauces','Tandoori Mayo Dip (250g)',85,105,'veg','250g','photo-1473093295043-cdd812d0e601',{trending:true,orderedTimes:200}),
  P('SA03','sauces','Schezwan Sauce (200g)',70,90,'veg','200g','photo-1565299624946-b28f40a0ae38',{orderedTimes:175}),
  P('SA04','sauces','Peri Peri Sauce (200g)',80,100,'veg','200g','photo-1612197527762-8cfb55b618d1',{orderedTimes:88}),
  P('SA05','sauces','Garlic Aioli Dip (250g)',95,120,'other','250g','photo-1607013251379-e6eecfffe234',{orderedTimes:60,desc:'Contains egg. Creamy roasted-garlic aioli for wraps & grills.'}),

  /* Samosas */
  P('SM01','samosas','Frozen Veg Samosa (12 pc)',110,140,'veg','480g','photo-1601050690597-df0568f70950',{bestseller:true,orderedTimes:610,trending:true}),
  P('SM02','samosas','Mini Punjabi Samosa (20 pc)',130,160,'veg','500g','photo-1601050690597-df0568f70950',{orderedTimes:240}),
  P('SM03','samosas','Chicken Keema Samosa (12 pc)',160,195,'non-veg','520g','photo-1606491956689-2ea866880c84',{orderedTimes:180}),
  P('SM04','samosas','Cheese Corn Samosa (10 pc)',140,170,'veg','450g','photo-1601050690597-df0568f70950',{trending:true,orderedTimes:120}),

  /* Rolls & Snacks */
  P('RO01','rolls','Veg Spring Roll (10 pc)',120,150,'veg','450g','photo-1626700051175-6818013e1d4f',{bestseller:true,orderedTimes:430}),
  P('RO02','rolls','Chicken Spring Roll (10 pc)',160,195,'non-veg','480g','photo-1559847844-5315695dadae',{orderedTimes:200,trending:true}),
  P('RO03','rolls','Aloo Tikki Patties (8 pc)',95,120,'veg','400g','photo-1601050690597-df0568f70950',{orderedTimes:150}),
  P('RO04','rolls','Veg Cutlet (10 pc)',110,135,'veg','450g','photo-1626074353765-517a681e40be',{orderedTimes:130}),
  P('RO05','rolls','Corn & Cheese Balls (12 pc)',135,165,'veg','420g','photo-1606755962773-d324e0a13086',{trending:true,orderedTimes:110}),
  P('RO06','rolls','Veg Momos (12 pc)',120,150,'veg','420g','photo-1604908176997-125f25cc6f3d',{orderedTimes:175}),

  /* Chicken Starters */
  P('CH01','chicken-starters','Chicken Lollipop (10 pc)',260,310,'non-veg','500g','photo-1562967914-608f82629710',{bestseller:true,orderedTimes:380,trending:true}),
  P('CH02','chicken-starters','Chicken Nuggets (15 pc)',210,250,'non-veg','450g','photo-1562967916-eb82221dfb92',{orderedTimes:240}),
  P('CH03','chicken-starters','Chicken Seekh Kebab (8 pc)',230,280,'non-veg','400g','photo-1529006557810-274b9b2fc783',{orderedTimes:160}),
  P('CH04','chicken-starters','Crispy Chicken Strips (12 pc)',240,290,'non-veg','450g','photo-1513639776629-7b61b0ac49cb',{trending:true,orderedTimes:130}),
  P('CH05','chicken-starters','Chicken 65 Boneless (300g)',220,265,'non-veg','300g','photo-1606491956689-2ea866880c84',{orderedTimes:190}),

  /* Seafood */
  P('SF01','seafood','Marinated Prawns (250g)',350,420,'non-veg','250g','photo-1565680018434-b513d5e5fd47',{bestseller:true,orderedTimes:210}),
  P('SF02','seafood','Fish Fingers (12 pc)',230,280,'non-veg','450g','photo-1580217593608-61931cefc821',{trending:true,orderedTimes:160}),
  P('SF03','seafood','Crumb-Fried Prawns (300g)',290,350,'non-veg','300g','photo-1559737558-2f5a35f4523b',{orderedTimes:120}),
  P('SF04','seafood','Basa Fish Fillet (500g)',260,320,'non-veg','500g','photo-1574781330855-d0db8cc6a79c',{orderedTimes:90}),
];

/* ---- Coupons ---- */
export const coupons: Record<string, Coupon> = {
  SAVE50:  { type: 'flat', value: 50, min: 300, label: '₹50 off on orders above ₹300' },
  FRESH10: { type: 'pct',  value: 10, max: 80, min: 200, label: '10% off (max ₹80)' },
  BLOSSOM: { type: 'pct',  value: 15, max: 120, min: 500, label: '15% off above ₹500' },
};

/* ---- Testimonials (TN tone, mixed language) ---- */
export const testimonials: Testimonial[] = [
  { name: 'Kavya R.', area: 'Avinashi', stars: 5, text: 'Frozen snacks ellam romba fresh-ah iruku. Evening guests vandha 20 mins-la samosa ready!' },
  { name: 'Mahesh Kumar', area: 'Tirupur', stars: 5, text: 'Mock meat quality super. Family weekly-ah ithula than order panrom. Delivery on time.' },
  { name: 'Priya S.', area: 'Mangalam', stars: 5, text: 'Paneer and exotic veggies are so fresh. Best hyperlocal store in our area, fully trusted.' },
  { name: 'Arun Prakash', area: 'Avinashi Road', stars: 5, text: 'Bulk order for my restaurant — clean packing, correct weight, 30 min delivery. Highly recommend.' },
  { name: 'Deepa V.', area: 'Palladam', stars: 4, text: 'Chicken starters taste like restaurant quality. Reorder option is very convenient.' },
];

/* ---- Mock geocode DB — areas around Avinashi, Tirupur ----
   Ported from location.html / login.html / address.html AREAS arrays. */
export interface Area {
  area: string;
  pincode: string;
  lat: number;
  lng: number;
}

export const AREAS: Area[] = [
  { area: 'Avinashi', pincode: '641654', lat: 11.1925, lng: 77.268 },
  { area: 'Avinashi Road, Tirupur', pincode: '641603', lat: 11.1389, lng: 77.321 },
  { area: 'Mangalam, Tirupur', pincode: '641663', lat: 11.1602, lng: 77.2475 },
  { area: 'Palladam', pincode: '641664', lat: 10.992, lng: 77.287 },
  { area: 'Tirupur Central', pincode: '641601', lat: 11.1085, lng: 77.3411 },
  { area: 'Annur', pincode: '641653', lat: 11.233, lng: 77.105 },
  { area: 'Somanur', pincode: '641668', lat: 11.07, lng: 77.173 },
  { area: 'Coimbatore RS Puram', pincode: '641002', lat: 11.008, lng: 76.956 }, // far -> not serviceable
  { area: 'Erode Town', pincode: '638001', lat: 11.341, lng: 77.7172 }, // far -> not serviceable
];
