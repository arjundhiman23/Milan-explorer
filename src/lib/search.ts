import type { CategoryId, Place } from "@/types";
import { CATEGORIES } from "@/data/categories";

// ─────────────────────────────────────────────────────────────────────────
// Search, built for Milan.
//
// 1. Concepts: "pizza", "kebab", "aula studio", "tabacchi" are kinds of place,
//    not names. Each concept has English + Italian terms, keywords to find it
//    in curated text, and OpenStreetMap filters for the live nearby search.
//    Italian meaning wins where words differ: libreria = bookshop,
//    biblioteca = library, bar = café, piazza = square, tabacchi = where you
//    buy bus tickets and the marca da bollo, latteria = dairy/trattoria.
// 2. Names match strictly (whole word or start of a word). "pizza" no longer
//    matches "Piazza", "Pizzelle" or "Peziza".
// 3. Typo tolerance is a fallback only: words of 6+ letters, same first
//    letter, and only when strict matching finds almost nothing.
// ─────────────────────────────────────────────────────────────────────────

export interface Concept {
  id: string;
  terms: string[];            // normalized query terms (English + Italian)
  category?: CategoryId;      // category for icons / colour
  broad?: boolean;            // matches the whole category locally (e.g. "restaurant")
  keywords: string[];         // whole words in curated name/description/tags; "abc*" = word prefix
  osm: string[];              // Overpass tag filters, e.g. '"amenity"="cafe"'
}

const cuisine = (re: string) => `"cuisine"~"${re}",i`;
const C = (id: string, category: CategoryId | undefined, terms: string, keywords: string, osm: string[], broad = false): Concept => ({
  id, category, broad,
  terms: terms.split("|").map((t) => normalize(t)).filter(Boolean),
  keywords: keywords ? keywords.split(" ").map((k) => k.replace(/_/g, " ")) : [],
  osm,
});

export const CONCEPTS: Concept[] = [
  // ── Food: dishes & cuisines ────────────────────────────────────────────
  C("pizza", "food", "pizza|pizze|pizzas|pizzeria|pizzerie|pizzaiolo|pizza al taglio|pizza a taglio|trancio|tranci|margherita|pizza napoletana|pizza romana",
    "pizza pizze pizzeria pizzerie pizzaiolo trancio", [cuisine("pizza")]),
  C("middle-eastern", "food", "shawarma|shawerma|shwarma|shawarma wrap|kebab|kebap|kebabs|doner|döner|doner kebab|durum|dürüm|falafel|hummus|houmous|lebanese|libanese|turkish|turco|turca|middle eastern|mediorientale|medio oriente|arabic|arabo|araba|syrian|siriano|israeli|israeliano|palestinian|palestinese|mezze|meze",
    "shawarma kebab doner falafel hummus lebanese turkish middle_eastern syrian mezze", [cuisine("kebab|shawarma|doner|falafel|lebanese|turkish|middle_eastern|arab|syrian|levantine|israeli|palestinian|mediterranean_east")]),
  C("greek", "food", "greek|greco|greca|greci|gyros|gyro|souvlaki|pita|pita gyros|tzatziki|moussaka",
    "greek gyros souvlaki", [cuisine("greek|gyros")]),
  C("japanese", "food", "sushi|japanese|giapponese|giapponesi|ramen|udon|soba|temaki|uramaki|nigiri|sashimi|onigiri|izakaya|tempura|gyoza|katsu|donburi",
    "sushi japanese ramen udon temaki izakaya", [cuisine("japanese|sushi|ramen|udon|soba")]),
  C("poke", "food", "poke|poké|poke bowl|hawaiian|hawaiano|bowl|bowls",
    "poke hawaiian bowl", [cuisine("poke|hawaiian")]),
  C("chinese", "food", "chinese|cinese|cinesi|dumpling|dumplings|ravioli cinesi|ravioleria|jiaozi|dim sum|dimsum|bao|baozi|hot pot|hotpot|wok|noodles|noodle|spaghetti cinesi|involtini primavera|spring rolls|sichuan|cantonese|hong kong",
    "chinese dumpling dumplings ravioleria dim_sum bao noodles wok", [cuisine("chinese|dim_sum|dumpling|noodle|cantonese|sichuan|hot_pot|asian")]),
  C("korean", "food", "korean|coreano|coreana|bibimbap|kimchi|korean bbq|tteokbokki|bulgogi",
    "korean kimchi", [cuisine("korean")]),
  C("thai", "food", "thai|tailandese|thailandese|pad thai|green curry|tom yum",
    "thai", [cuisine("thai")]),
  C("vietnamese", "food", "vietnamese|vietnamita|vietnamiti|pho|phở|banh mi|bánh mì|bun bo",
    "vietnamese pho", [cuisine("vietnamese")]),
  C("indian", "food", "indian|indiano|indiana|curry|biryani|tandoori|naan|masala|tikka|dal|dhal|samosa|pakistani|pakistano|nepalese|nepali|sri lankan|srilankese|bangladeshi|bengalese|south asian",
    "indian curry biryani tandoori pakistani nepalese", [cuisine("indian|pakistani|nepalese|sri_lankan|bangladeshi|curry|south_asian|himalayan")]),
  C("mexican", "food", "mexican|messicano|messicana|tacos|taco|taqueria|burrito|burritos|nachos|quesadilla|quesadillas|enchiladas|tex mex|tex-mex|guacamole",
    "mexican tacos taco burrito taqueria", [cuisine("mexican|tex-mex|tacos|taco|burrito")]),
  C("latin", "food", "peruvian|peruviano|peruviana|ceviche|brazilian|brasiliano|brasiliana|churrasco|churrascaria|argentinian|argentine|argentino|argentina|empanada|empanadas|venezuelan|venezuelano|arepa|arepas|colombian|colombiano|cuban|cubano|latin american|sudamericano|latino",
    "peruvian ceviche brazilian argentinian empanadas arepas latin", [cuisine("peruvian|brazilian|argentinian|argentine|latin_american|venezuelan|colombian|cuban|empanada|south_american")]),
  C("african", "food", "ethiopian|etiope|etiopica|eritrean|eritreo|eritrea|injera|moroccan|marocchino|marocchina|couscous|cous cous|tagine|tajine|senegalese|nigerian|nigeriano|african|africano|africana|maghreb|tunisian|tunisino|egyptian|egiziano",
    "ethiopian eritrean injera moroccan couscous african", [cuisine("ethiopian|eritrean|african|moroccan|senegalese|north_african|maghreb|tunisian|egyptian|nigerian")]),
  C("persian", "food", "persian|persiano|persiana|iranian|iraniano|georgian|georgiano|khachapuri|afghan|afghano|uzbek|armenian|armeno",
    "persian iranian georgian afghan", [cuisine("persian|iranian|georgian|afghan|uzbek|armenian")]),
  C("spanish", "food", "spanish|spagnolo|spagnola|tapas|paella|sangria|churros",
    "spanish tapas paella", [cuisine("spanish|tapas")]),
  C("french", "food", "french|francese|crepe|crepes|crêpe|crêpes|creperie|crêperie|galette|bistrot|bistro|croque",
    "french crepe crepes creperie bistrot", [cuisine("french|crepe|crêpe")]),
  C("burger", "food", "burger|burgers|hamburger|hamburgers|hamburgeria|smash burger|cheeseburger|hot dog|hotdog|fried chicken|pollo fritto|chicken wings|wings|bbq|barbecue|smokehouse|ribs|american food|cucina americana|diner",
    "burger burgers hamburger hamburgeria bbq barbecue chicken", [cuisine("burger|american|chicken|hot_dog|barbecue|bbq|wings")]),
  C("steak", "food", "steak|steaks|steakhouse|bistecca|bistecche|fiorentina|bistecca alla fiorentina|grill|grigliata|braceria|carne alla brace|tagliata|meat",
    "steak bistecca fiorentina grill braceria brace", [cuisine("steak_house|steak|grill|meat|barbecue"), '"amenity"="restaurant"]["name"~"braceria|steak",i']),
  C("seafood", "food", "seafood|fish|pesce|frutti di mare|crudo di pesce|crudi|ostriche|oysters|oyster bar|fish and chips|fritto misto|sushi di pesce|pesce fresco",
    "seafood fish pesce oysters ostriche crudi", [cuisine("seafood|fish|fish_and_chips|oyster")]),
  C("vegan", "food", "vegan|vegano|vegana|vegani|vegane|vegetarian|vegetariano|vegetariana|vegetariani|veggie|plant based|plant-based|cucina vegetale",
    "vegan vegano vegetarian vegetariano veggie", ['"diet:vegan"~"yes|only"', '"diet:vegetarian"~"yes|only"', cuisine("vegan|vegetarian")]),
  C("gluten-free", "food", "gluten free|gluten-free|senza glutine|celiac|celiaco|celiaca|celiachia|coeliac",
    "gluten senza_glutine celiac", ['"diet:gluten_free"~"yes|only"']),
  C("halal", "food", "halal|macelleria halal", "halal", ['"diet:halal"~"yes|only"', cuisine("halal")]),
  C("kosher", "food", "kosher|kasher|casher", "kosher", ['"diet:kosher"~"yes|only"', cuisine("kosher")]),
  C("sandwich", "food", "sandwich|sandwiches|panino|panini|paninoteca|paninaro|tramezzino|tramezzini|toast|piadina|piadine|piadineria|bagel|bagels|wrap|wraps|schiacciata|focaccia farcita|club sandwich",
    "panino panini paninoteca sandwich sandwiches piadina piadineria tramezzin* bagel toast", [cuisine("sandwich|piadina|bagel|panini|toast|wrap")]),
  C("focaccia", "food", "focaccia|focacce|focacceria|farinata|pesto|ligure|genovese|focaccia genovese|focaccia di recco",
    "focaccia focacceria farinata ligurian genovese", [cuisine("focaccia|ligurian")]),
  C("street-food", "food", "street food|streetfood|cibo di strada|fritto|fritti|friggitoria|arancini|arancino|arancina|arancine|supplì|suppli|panzerotti|panzerotto|olive ascolane|cuoppo|rosticceria|rosticcerie|tavola calda|gastronomia|takeaway|take away|da asporto|asporto|fast food",
    "street_food panzerott* arancin* suppli rosticceria friggitoria fried gastronomia takeaway", [cuisine("street_food|friture|fried|rosticceria|deli|arancini"), '"amenity"="fast_food"', '"shop"="deli"']),
  C("italian", "food", "trattoria|trattorie|osteria|osterie|italian|italiano|italiana|cucina italiana|pasta|pastasciutta|risotto|risotti|carbonara|amatriciana|cacio e pepe|lasagne|lasagna|tortellini|tortelli|gnocchi|ravioli|tagliatelle|agnolotti|orecchiette|cotoletta|cotoletta alla milanese|costoletta|ossobuco|osso buco|cassoeula|polenta|risotto alla milanese|zafferano|mondeghili|milanese|cucina milanese|lombarda|cucina lombarda|romana|cucina romana|napoletana|siciliana|pugliese|sarda|toscana|piemontese|emiliana|veneta|calabrese|cucina casalinga|home cooking|homemade pasta|pasta fresca",
    "trattoria osteria pasta risotto cotoletta ossobuco cassoeula polenta milanese agnolotti tortelli* mondeghili lombard* italian", [cuisine("italian|regional|lombard|milanese|sicilian|neapolitan|roman|apulian|sardinian|tuscan|piedmontese|emilian|venetian|calabrian|italian_pizza")]),
  C("breakfast", "cafes", "breakfast|colazione|fare colazione|brunch|cornetto|cornetti|brioche|brioches|croissant|croissants|pancake|pancakes|waffle|waffles|avocado toast|uova|eggs benedict",
    "breakfast brunch brioche croissant cornett* pancakes", [cuisine("breakfast|brunch|pancake|waffle"), '"shop"="pastry"']),
  C("pastry", "cafes", "pasticceria|pasticcerie|pastry|pastries|patisserie|pâtisserie|dolci|dolce|dessert|desserts|cake|cakes|torta|torte|tiramisu|tiramisù|cannoli|cannolo|sfogliatella|sfogliatelle|maritozzo|maritozzi|krapfen|bombolone|bomboloni|panettone|colomba|biscotti|pasticcini|macarons|cheesecake",
    "pasticceria pastry pastries cake dessert dolci tiramisu cannoli panettone brioche sfogliatin*", ['"shop"="pastry"', '"shop"="confectionery"', cuisine("cake|dessert|pastry|patisserie")]),
  C("bakery", "cafes", "bakery|bakeries|panetteria|panetterie|panificio|panifici|forno|fornaio|pane|bread|sourdough|lievito madre|pane fresco",
    "bakery panetteria panificio forno bread sourdough", ['"shop"="bakery"']),
  C("gelato", "food", "gelato|gelati|gelateria|gelaterie|ice cream|icecream|ice-cream|cremeria|granita|granite|sorbetto|sorbet|semifreddo|frozen yogurt|yogurteria|froyo|affogato",
    "gelato gelati gelateria granita sorbetto semifreddo", ['"amenity"="ice_cream"', '"shop"="ice_cream"', cuisine("ice_cream|frozen_yogurt|gelato")]),
  C("chocolate", "food", "chocolate|cioccolato|cioccolata|cioccolata calda|cioccolateria|chocolatier|praline|pralines|hot chocolate",
    "chocolate cioccolat* pralines", ['"shop"="chocolate"', cuisine("chocolate")]),
  C("coffee", "cafes", "coffee|coffees|caffe|caffè|caffetteria|cafe|cafes|café|cafés|espresso|cappuccino|cappuccini|macchiato|latte macchiato|flat white|specialty coffee|caffè specialty|filter coffee|cold brew|bar|bar caffè|caffè bar|marocchino caffè",
    "coffee caff* cafe espresso cappuccino", ['"amenity"="cafe"']),
  C("tea", "cafes", "tea|teas|tè|sala da tè|tea room|teahouse|bubble tea|boba|matcha|chai",
    "tea bubble_tea matcha", [cuisine("tea|bubble_tea"), '"shop"="tea"']),
  C("juice", "cafes", "juice|juices|succo|succhi|spremuta|spremute|smoothie|smoothies|centrifuga|centrifugato|centrifugati|estratto|estratti|acai|açaí|acai bowl",
    "juice smoothie spremuta centrifug*", [cuisine("juice|smoothie")]),
  C("drinks", "food", "aperitivo|aperitivi|apericena|happy hour|spritz|aperol|negroni|negroni sbagliato|cocktail|cocktails|cocktail bar|mixology|drinks|drink|bere|pub|pubs|birreria|birrerie|beer|beers|birra|birre|craft beer|birra artigianale|bar|bars|speakeasy|rooftop bar|nightcap",
    "aperitivo spritz negroni sbagliato cocktail cocktails pub birreria beer drinks", ['"amenity"="bar"', '"amenity"="pub"', '"amenity"="biergarten"']),
  C("wine", "food", "wine|wines|vino|vini|enoteca|enoteche|wine bar|vineria|wine shop|bottiglieria|calice|natural wine|vino naturale",
    "wine vino enoteca vineria", ['"shop"="wine"', '"amenity"="bar"]["name"~"enoteca|vineria|vino|wine",i']),
  C("restaurant", "food", "restaurant|restaurants|ristorante|ristoranti|dinner|cena|cenare|lunch|pranzo|pranzare|eat|eating|mangiare|dove mangiare|where to eat|food|cibo|cucina",
    "", ['"amenity"="restaurant"'], true),
  C("cheap", undefined, "cheap|cheap eats|economico|economica|economici|budget|low cost|low-cost|student|students|studenti|studentesco|affordable|poco prezzo|a buon prezzo",
    "cheap student affordable fair_prices fair_price cheap_eats", []),

  // ── Study & cafés ───────────────────────────────────────────────────────
  C("study", "cafes", "study|studying|studiare|aula studio|aule studio|sala studio|sale studio|library|libraries|biblioteca|biblioteche|coworking|co-working|cowork|laptop|wifi|wi-fi|quiet place to study|posto per studiare|reading room|sala lettura",
    "library biblioteca study studying coworking reading laptop", ['"amenity"="library"', '"amenity"="coworking_space"', '"office"="coworking"']),

  // ── Culture ─────────────────────────────────────────────────────────────
  C("museum", "culture", "museum|museums|museo|musei|gallery|galleries|art gallery|galleria d'arte|art|arte|mostra|mostre|exhibition|exhibitions|esposizione|pinacoteca|pinacoteche|contemporary art|arte contemporanea",
    "museum museo musei gallery galleria pinacoteca art arte exhibition exhibitions mostra", ['"tourism"="museum"', '"tourism"="gallery"', '"amenity"="arts_centre"']),
  C("church", "culture", "church|churches|chiesa|chiese|basilica|basiliche|duomo|cathedral|cattedrale|chapel|cappella|abbey|abbazia|monastery|monastero|convent|convento|cloister|cloisters|chiostro|chiostri|santuario|sanctuary",
    "church chiesa basilica cathedral duomo chapel cappella abbey abbazia cloister* chiostr* monastery", ['"amenity"="place_of_worship"']),
  C("sights", "culture", "sights|sightseeing|attractions|attrazioni|cosa vedere|things to do|cosa fare|landmark|landmarks|monument|monuments|monumento|monumenti|castle|castello|palazzo|palazzi|palace|historic|storico|storica|ruins|rovine|roman|romano|romani|colonne|tower|torre",
    "castle castello palazzo palace monument tower torre roman historic", ['"tourism"="attraction"', '"historic"~"monument|castle|ruins|memorial|archaeological_site"']),
  C("cinema", "culture", "cinema|cinemas|movie|movies|film|films|multisala|cineforum|original language|lingua originale|versione originale",
    "cinema film screen", ['"amenity"="cinema"']),
  C("theatre", "culture", "theatre|theater|theatres|teatro|teatri|opera|ballet|balletto|concert|concerts|concerto|concerti|live music|musica dal vivo|jazz|music|musica|classical music|musica classica|orchestra",
    "theatre teatro opera concert concerts concerto music jazz", ['"amenity"="theatre"', '"amenity"="concert_hall"', '"amenity"="music_venue"']),
  C("nightlife", "food", "club|clubs|discoteca|discoteche|disco|nightclub|nightclubs|nightlife|vita notturna|ballare|dancing|party|serata|serate|movida",
    "club nightlife late_opening", ['"amenity"="nightclub"']),
  C("squares", "culture", "piazza|piazze|square|squares|piazzale|largo",
    "piazza square", ['"place"="square"']),

  // ── Outdoors, water & sport ─────────────────────────────────────────────
  C("park", "outdoors", "park|parks|parco|parchi|garden|gardens|giardino|giardini|green|green space|verde|picnic|prato|prati|lawn|nature|natura|bosco|boschi|woods|forest|orto botanico|botanical garden",
    "park parco parchi garden gardens giardino giardini lawn green picnic woodland", ['"leisure"="park"', '"leisure"="garden"', '"leisure"="nature_reserve"']),
  C("sport", "outdoors", "run|running|runner|correre|corsa|jogging|gym|gyms|palestra|palestre|fitness|yoga|pilates|crossfit|sport|sports|calcetto|football|calcio|soccer|tennis|padel|basket|basketball|volley|pallavolo|climbing|arrampicata|boulder|bouldering",
    "running gym fitness yoga sport sports run", ['"leisure"="fitness_centre"', '"leisure"="sports_centre"', '"sport"="climbing"', '"leisure"="pitch"]["access"!~"private"']),
  C("water", "outdoors", "swim|swimming|nuotare|nuoto|pool|pools|piscina|piscine|swimming pool|beach|beaches|spiaggia|spiagge|lido|lidi|lake|lakes|lago|laghi|sea|mare|sunbathe|sunbathing|prendere il sole|tintarella|water park|acquapark",
    "pool pools swim swimming beach beaches lido lake lago piscina sea", ['"leisure"="swimming_pool"]["access"!~"private|customers"', '"natural"="beach"', '"leisure"~"beach_resort|water_park"']),
  C("canals", "outdoors", "navigli|naviglio|canal|canals|canale|canali|darsena|alzaia",
    "navigli naviglio canal canals darsena alzaia", []),
  C("views", "gems", "view|views|vista|viste|panorama|panoramic|panoramico|panoramica|rooftop|rooftops|terrazza|terrazze|terrace|sunset|sunsets|tramonto|skyline|belvedere|from above|dall'alto",
    "view views rooftop sunset terrace terrazza skyline panorama spires", ['"tourism"="viewpoint"']),
  C("bike", "essentials", "bike|bikes|bicycle|bicicletta|biciclette|bici|cycling|cycle|ciclabile|pista ciclabile|bikemi|bike sharing|bikesharing|bike rental|noleggio bici|scooter|monopattino|monopattini",
    "bike cycle cycling ride", ['"amenity"="bicycle_rental"', '"shop"="bicycle"']),
  C("spa", "gems", "spa|spas|terme|thermal|thermal baths|sauna|saune|massage|massaggio|massaggi|wellness|benessere|hammam|bagno turco|centro benessere",
    "spa terme sauna wellness", ['"leisure"~"sauna|spa"', '"shop"="massage"', '"amenity"="public_bath"']),

  // ── Shopping ────────────────────────────────────────────────────────────
  C("supermarket", "shopping", "supermarket|supermarkets|supermercato|supermercati|grocery|groceries|grocery store|spesa|fare la spesa|alimentari|negozio di alimentari|minimarket|mini market|discount|ipermercato|food shop",
    "supermarket grocery groceries alimentari esselunga lidl carrefour conad coop pam eurospin unes penny aldi despar naturas* tigros bennet", ['"shop"="supermarket"', '"shop"="convenience"']),
  C("asian-grocery", "shopping", "asian supermarket|asian grocery|supermercato asiatico|alimentari asiatici|etnico|etnici|international food|negozio etnico|indian grocery|african shop",
    "asian", ['"shop"~"supermarket|convenience"]["name"~"asia|orient|kathay|china|india|bazar|bazaar|halal",i']),
  C("market", "shopping", "market|markets|mercato|mercati|mercatino|mercatini|farmers market|mercato contadino|mercato rionale|mercato comunale|bancarelle|street market",
    "market markets mercato mercatone mercatino stalls", ['"amenity"="marketplace"']),
  C("vintage", "shopping", "vintage|second hand|second-hand|secondhand|usato|thrift|thrift store|thrift shop|charity shop|mercatino dell'usato|antiques|antiquariato|antiquario|retro|flea market",
    "vintage antiques antiquariato flea second-hand charity", ['"shop"="second_hand"', '"shop"="antiques"', '"shop"="charity"']),
  C("books", "shopping", "book|books|bookshop|bookshops|bookstore|bookstores|libreria|librerie|libri|libro|fumetti|comics|manga|fumetteria",
    "books bookshop bookshops bookstore libreria librerie", ['"shop"="books"']),
  C("clothes", "shopping", "clothes|clothing|abbigliamento|vestiti|fashion|moda|outlet|outlets|boutique|scarpe|shoes|sneakers|negozi|negozio|shopping|mall|centro commerciale|department store|grandi magazzini",
    "clothes fashion shopping boutique outlet", ['"shop"="clothes"', '"shop"="shoes"', '"shop"="mall"', '"shop"="department_store"']),
  C("greengrocer", "shopping", "fruit|frutta|verdura|vegetables|veggies|fruttivendolo|ortofrutta|greengrocer|produce",
    "produce fruit vegetables", ['"shop"="greengrocer"']),
  C("butcher", "shopping", "butcher|butchers|macelleria|macellerie|macellaio",
    "butcher macelleria", ['"shop"="butcher"']),
  C("fishmonger", "shopping", "pescheria|pescherie|fishmonger|fish shop|fish market|mercato del pesce",
    "fish pescheria", ['"shop"="seafood"']),
  C("deli", "shopping", "cheese|formaggio|formaggi|salumeria|salumerie|salumi|salumiere|deli|delicatessen|prosciutto|latteria|caseificio|mozzarella|burrata|parmigiano",
    "cheese salumeria salumi deli latteria", ['"shop"="cheese"', '"shop"="deli"', '"shop"="dairy"']),
  C("fresh-pasta", "shopping", "pastificio|pastifici|fresh pasta shop|negozio di pasta fresca",
    "pastificio", ['"shop"="pasta"']),
  C("organic", "shopping", "organic|biologico|biologica|bio|erboristeria|erboristerie|herbalist|health food|integratori|naturasi|naturasì",
    "organic biologico erboristeria naturas*", ['"shop"="organic"', '"shop"="health_food"', '"shop"="herbalist"']),
  C("florist", "shopping", "flowers|flower shop|fiori|fiorista|fioraio|fioristi|florist|piante|plants|vivaio|garden centre",
    "flowers florist fiori", ['"shop"="florist"', '"shop"="garden_centre"']),
  C("gifts", "shopping", "souvenir|souvenirs|gift|gifts|regalo|regali|gift shop|negozio di regali|design shop|concept store",
    "souvenir gift gifts concept_store", ['"shop"="gift"']),
  C("music-shop", "shopping", "records|record shop|vinyl|vinyls|vinili|vinile|dischi|negozio di dischi|music shop|strumenti musicali|musical instruments",
    "records vinyl dischi", ['"shop"="music"', '"shop"="musical_instrument"']),
  C("beauty", "shopping", "hairdresser|hairdressers|parrucchiere|parrucchiera|parrucchieri|barber|barbers|barbiere|barbieri|barbershop|haircut|taglio capelli|nails|nail salon|unghie|manicure|estetista|centro estetico|beauty|beauty salon|profumeria|profumerie|cosmetics|cosmetici|makeup|make-up|trucco|skincare",
    "hairdresser barber beauty cosmetics", ['"shop"="hairdresser"', '"shop"="beauty"', '"shop"="cosmetics"', '"shop"="perfumery"']),
  C("optician", "shopping", "optician|opticians|ottico|ottica|occhiali|glasses|eyeglasses|sunglasses|occhiali da sole|lenti a contatto|contact lenses",
    "optician ottico", ['"shop"="optician"']),
  C("sports-shop", "shopping", "sports shop|sport shop|articoli sportivi|negozio di sport|running shoes|scarpe da corsa|sportswear|abbigliamento sportivo",
    "sports", ['"shop"="sports"']),
  C("homewares", "shopping", "hardware|ferramenta|homewares|household|casalinghi|kitchenware|hangers|grucce|bedding|lenzuola|home decor|arredamento|furniture|mobili|ikea|tiger|flying tiger",
    "household hardware ferramenta", ['"shop"="hardware"', '"shop"="doityourself"', '"shop"="houseware"', '"shop"="variety_store"', '"shop"="furniture"']),

  // ── Everyday essentials (Italy-specific meanings) ──────────────────────
  C("pharmacy", "essentials", "pharmacy|pharmacies|farmacia|farmacie|chemist|chemists|medicine|medicines|medicinale|medicinali|farmaco|farmaci|parafarmacia|parafarmacie|drugstore|night pharmacy|farmacia notturna|farmacia di turno|farmacia aperta",
    "pharmacy pharmac* farmacia farmacie", ['"amenity"="pharmacy"', '"shop"="chemist"']),
  C("health", "essentials", "hospital|hospitals|ospedale|ospedali|emergency|emergency room|emergenza|pronto soccorso|doctor|doctors|dottore|medico|medici|guardia medica|medico di base|clinic|clinics|clinica|poliambulatorio|ambulatorio|dentist|dentists|dentista|dentisti|walk in clinic|gp",
    "hospital ospedale emergency pronto_soccorso policlinico doctor clinic", ['"amenity"="hospital"', '"amenity"="clinic"', '"amenity"="doctors"', '"amenity"="dentist"']),
  C("laundry", "essentials", "laundry|laundromat|laundrette|lavanderia|lavanderie|lavanderia self service|lavanderia a gettoni|lavasecco|tintoria|dry cleaning|dry cleaner|washing|washing machine|lavatrice|bucato",
    "laundry laundromat lavanderia", ['"shop"="laundry"', '"shop"="dry_cleaning"']),
  C("post", "essentials", "post office|post|poste|poste italiane|ufficio postale|uffici postali|parcel|parcels|pacco|pacchi|spedire|spedizione|spedizioni|shipping|send a package|posta|raccomandata|kit permesso|kit per il permesso",
    "post poste parcel parcels permesso", ['"amenity"="post_office"']),
  C("money", "essentials", "atm|atms|cash machine|cashpoint|bancomat|bank|banks|banca|banche|cash|contanti|prelievo|prelevare|cambio|money exchange|currency exchange|cambiavalute|western union|money transfer|ria|moneygram",
    "atm bank banca", ['"amenity"="atm"', '"amenity"="bank"', '"amenity"="bureau_de_change"', '"amenity"="money_transfer"']),
  C("transport", "essentials", "metro|metropolitana|subway|underground|tube|station|stations|stazione|stazioni|train|trains|treno|treni|tram|trams|bus|buses|autobus|fermata|fermate|stop|trasporti|public transport|mezzi|mezzi pubblici|atm milano|trenord|passante|malpensa express|airport|aeroporto|linate|malpensa|orio al serio",
    "metro station stazione train tram bus m1 m2 m3 m4 m5 airport", ['"railway"="station"', '"station"="subway"', '"public_transport"="station"']),
  C("tobacconist", "essentials", "tabacchi|tabaccheria|tabaccherie|tabaccaio|tabacchino|tobacco|tobacconist|tobacconists|cigarettes|sigarette|bus tickets|bus ticket|biglietti|biglietto|biglietti autobus|biglietti atm|ticket|tickets|marca da bollo|bollo|ricarica|ricarica telefonica|lotto|gratta e vinci",
    "tabacchi tabaccheria tobacco tickets", ['"shop"="tobacco"']),
  C("newsagent", "essentials", "edicola|edicole|newsagent|newsagents|newsstand|kiosk|chiosco|newspaper|newspapers|giornale|giornali|rivista|riviste|magazine|magazines",
    "edicola newsagent newspapers", ['"shop"="newsagent"', '"shop"="kiosk"']),
  C("stationery", "essentials", "stationery|cartoleria|cartolerie|quaderni|notebook|notebooks|pens|penne|copisteria|copisterie|copy shop|print|printing|print shop|stampa|stampare|stampe|fotocopie|photocopy|photocopies|rilegatura|binding|tesi",
    "stationery cartoleria copisteria print printing", ['"shop"="stationery"', '"shop"="copyshop"']),
  C("phone", "essentials", "phone|phones|telefono|telefoni|cellulare|cellulari|smartphone|sim|sim card|scheda sim|esim|tim|vodafone|windtre|wind tre|iliad|ho mobile|very mobile|fastweb|phone repair|riparazione telefoni|riparazione cellulari|charger|caricatore|electronics|elettronica|mediaworld|unieuro|computer|laptop repair",
    "phone sim electronics", ['"shop"="mobile_phone"', '"shop"="electronics"', '"shop"="computer"']),
  C("bureaucracy", "essentials", "questura|permesso di soggiorno|permesso|permit|residence permit|immigration|immigrazione|ufficio immigrazione|comune|anagrafe|municipio|town hall|codice fiscale|tax code|agenzia delle entrate|tax office|patronato|consolato|consolati|consulate|embassy|ambasciata|police|polizia|carabinieri|vigili|police station|commissariato",
    "questura immigra* permesso comune anagrafe police polizia", ['"amenity"="police"', '"amenity"="townhall"', '"office"="government"', '"diplomatic"="consulate"']),
  C("university", "culture", "university|universities|università|universita|uni|unimi|statale|la statale|campus|ateneo|facoltà|facolta|faculty|lecture|lezione|lezioni|aula|aule|mensa|mense|student canteen|canteen|segreteria studenti|politecnico|polimi|bocconi|bicocca|cattolica|iulm|festa del perdono|conservatorio",
    "universit* campus statale faculty lecture perdono conservatorio library", ['"amenity"="university"', '"amenity"="college"']),
  C("toilets", "essentials", "toilet|toilets|bagno|bagni|bagno pubblico|bagni pubblici|restroom|restrooms|wc|servizi igienici|bathroom|public toilet",
    "toilets", ['"amenity"="toilets"']),
  C("water-fountain", "essentials", "fontanella|fontanelle|vedovella|vedovelle|drinking water|water fountain|acqua potabile|refill water|casa dell'acqua",
    "fountain", ['"amenity"="drinking_water"']),

  // ── Vibes ───────────────────────────────────────────────────────────────
  C("date", undefined, "date|date night|date spot|romantic|romantico|romantica|appuntamento|anniversary|anniversario|cena romantica",
    "date_spot date romantic sunset", []),
  C("quiet", undefined, "quiet|calm|peaceful|tranquillo|tranquilla|tranquilli|silenzioso|silenziosa|silenzio|relax|relaxing|rilassante",
    "quiet calm peaceful silent", []),
  C("rainy", undefined, "rainy|rainy day|rain|pioggia|piove|quando piove|indoor|indoors|al chiuso",
    "rainy_day indoor", []),
  C("late", undefined, "late|late night|open late|aperto tardi|aperto la sera|aperto di notte|night|notte|24h|24 ore|24/7|after midnight|dopo mezzanotte",
    "late_opening late 24-hour night", []),
  C("free", undefined, "free|free entry|gratis|gratuito|gratuita|gratuiti|ingresso libero|ingresso gratuito|no cost",
    "free", []),
  C("outdoor-seating", undefined, "outdoor seating|outside|outdoor|dehors|all'aperto|all aperto|terrazzino|cortile|courtyard|garden seating",
    "outdoor_seating outdoor garden courtyard terrace", []),
  C("trips", "trips", "day trip|day trips|daytrip|gita|gite|gita fuori porta|fuori porta|weekend away|weekend|excursion|escursione|escursioni|hike|hiking|trekking|mountains|montagna|montagne|lakes|i laghi|vineyard|vineyards|vigneto|vigneti|vigna|winery|wineries|cantina|cantine|wine tasting|degustazione|franciacorta|oltrepo|oltrepò",
    "", [], true),
];

// ── Text helpers ──────────────────────────────────────────────────────────
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, " ").replace(/[^a-z0-9/ ]+/g, " ").replace(/\s+/g, " ").trim();
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const words = (s: string) => s.split(" ").filter(Boolean);

/** Keyword hit on normalized text: whole word (or phrase); "abc*" = word prefix. */
function kwHit(text: string, kw: string): boolean {
  const k = normalize(kw.replace(/\*$/, ""));
  if (!k) return false;
  const prefix = kw.endsWith("*");
  const t = ` ${text} `;
  if (k.includes(" ")) return t.includes(` ${k} `) || (prefix && t.includes(` ${k}`));
  return prefix ? words(text).some((w) => w.startsWith(k)) : words(text).some((w) => w === k || w === `${k}s`);
}

/** Every query word is a whole word or the start of a word in the name. */
function strictNameHit(qWords: string[], name: string): boolean {
  const nw = words(name);
  return qWords.every((q) => nw.some((w) => w === q || (q.length >= 3 && w.startsWith(q))));
}

/** Typo tolerance, fallback only: 6+ letters, same first letter, ≤1 edit (≤2 for 9+). */
function fuzzyNameHit(qWords: string[], name: string): boolean {
  const nw = words(name);
  const long = qWords.filter((q) => q.length >= 6);
  if (!long.length) return false;
  return long.every((q) => {
    const tol = q.length >= 9 ? 2 : 1;
    return nw.some((w) => w[0] === q[0] && Math.abs(w.length - q.length) <= tol && lev(q, w) <= tol);
  });
}

// ── Concept matching ──────────────────────────────────────────────────────
// Groups: concepts found from the same query term are alternatives (Italian
// "bar" = café OR drinks bar). Separate groups must all hold ("vegan pizza").
export interface ConceptMatch { groups: Concept[][]; rest: string[] }

const TERM_INDEX: [string, Concept[]][] = (() => {
  const m = new Map<string, Concept[]>();
  for (const c of CONCEPTS) for (const t of c.terms) m.set(t, [...(m.get(t) ?? []), c]);
  return [...m.entries()].sort((a, b) => b[0].length - a[0].length);
})();

// "via torino", "piazza duomo", "corso como": addresses and place names, not kinds of place.
const STREET_WORDS = new Set(["via", "viale", "corso", "piazza", "piazzale", "piazzetta", "largo", "vicolo", "alzaia", "ripa", "galleria", "strada", "foro"]);

export function matchConcepts(query: string): ConceptMatch {
  const norm = normalize(query);
  const all = words(norm);
  if (!all.length) return { groups: [], rest: [] };
  if (all.length >= 2 && STREET_WORDS.has(all[0])) return { groups: [], rest: all };

  let q = ` ${norm} `;
  const groups: Concept[][] = [];
  for (const [t, cs] of TERM_INDEX) {
    if (q.includes(` ${t} `)) { groups.push(cs); q = q.replace(` ${t} `, " "); }
  }
  let rest = words(q);
  if (!groups.length && rest.length) {
    // The last word may still be being typed: prefix of a single-word term.
    const last = rest[rest.length - 1];
    if (last.length >= 4) {
      const hit = new Set<Concept>();
      for (const [t, cs] of TERM_INDEX) if (!t.includes(" ") && t.startsWith(last)) cs.forEach((c) => hit.add(c));
      if (hit.size) { groups.push([...hit]); rest = rest.slice(0, -1); }
    }
  }
  if (!groups.length) {
    // Typo fallback for concept words: 6+ letters, same first letter, one edit ("shawrma").
    for (const w of rest.filter((x) => x.length >= 6)) {
      const hit = new Set<Concept>();
      for (const [t, cs] of TERM_INDEX) if (!t.includes(" ") && t.length >= 5 && t[0] === w[0] && lev(w, t) <= 1) cs.forEach((c) => hit.add(c));
      if (hit.size) { groups.push([...hit]); rest = rest.filter((x) => x !== w); }
    }
  }
  return { groups, rest };
}

function placeMatchesConcept(c: Concept, p: Place, name: string, text: string): number {
  if (c.keywords.some((k) => kwHit(name, k))) return 55;
  if (c.keywords.some((k) => kwHit(text, k))) return 45;
  if (c.broad && c.category === p.category) return 35;
  return 0;
}
const groupScore = (g: Concept[], p: Place, name: string, text: string) => Math.max(...g.map((c) => placeMatchesConcept(c, p, name, text)));

export interface Scored { place: Place; score: number }

export function scoreLocal(query: string, places: Place[]): Scored[] {
  const q = normalize(query);
  if (!q) return [];
  const qWords = words(q);
  const { groups, rest } = matchConcepts(query);
  const catLabelHits = CATEGORIES.filter((c) => strictNameHit(qWords, normalize(c.label))).map((c) => c.id);

  const scored: Scored[] = [];
  for (const p of places) {
    const name = normalize(p.name);
    const text = normalize(`${p.shortDescription ?? ""} ${(p.tags ?? []).join(" ")}`);
    const where = normalize(`${p.neighbourhood ?? ""} ${p.address ?? ""}`);
    let score = 0;

    // Names: strict only.
    if (name === q) score += 100;
    else if (name.startsWith(`${q} `) || name === q) score += 85;
    else if (` ${name} `.includes(` ${q} `)) score += 70;
    else if (strictNameHit(qWords, name)) score += 60;

    // Concepts: every group in the query must be satisfied ("vegan pizza").
    if (groups.length) {
      const per = groups.map((g) => groupScore(g, p, name, text));
      if (per.every((v) => v > 0)) {
        score += per.reduce((a, b) => a + b, 0);
        // Leftover words narrow further ("pizza navigli").
        if (rest.length && !rest.every((w) => kwHit(`${name} ${text} ${where}`, `${w}*`))) score = Math.min(score, 20);
      }
    }

    if (catLabelHits.includes(p.category)) score += 30;
    if (!groups.length && qWords.some((w) => w.length >= 3 && kwHit(text, `${w}*`))) score += 15;
    if (qWords.some((w) => w.length >= 3 && kwHit(where, `${w}*`))) score += 12;

    if (score > 0) scored.push({ place: p, score });
  }

  // Typo fallback, only when strict matching found almost nothing and the
  // query isn't a known kind of place.
  const strong = scored.filter((s) => s.score >= 40).length;
  if (strong < 3 && !groups.length) {
    const have = new Set(scored.map((s) => s.place.id));
    for (const p of places) if (!have.has(p.id) && fuzzyNameHit(qWords, normalize(p.name))) scored.push({ place: p, score: 35 });
  }
  return scored.sort((a, b) => b.score - a.score);
}

/** Keeps a live-search (Photon) result only if it really matches the query. */
export function acceptRemoteResult(query: string, p: Place): boolean {
  const name = normalize(p.name);
  const qWords = words(normalize(query));
  if (!qWords.length) return false;
  if (strictNameHit(qWords, name)) return true;
  const { groups } = matchConcepts(query);
  if (groups.length) {
    const text = normalize(`${p.shortDescription ?? ""}`);
    return groups.every((g) => g.some((c) => c.keywords.some((k) => kwHit(name, k) || kwHit(text, k))));
  }
  return fuzzyNameHit(qWords, name);
}
