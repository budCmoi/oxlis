require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const buildDescription = (sections) => sections.map(({ title, body }) => `${title}\n${body}`).join("\n\n");

const galleries = {
  saas: ["/listing-saas.svg", "/listing-overview.svg", "/listing-growth.svg"],
  commerce: ["/listing-ecommerce.svg", "/listing-overview.svg", "/listing-diligence.svg"],
  content: ["/listing-content.svg", "/listing-growth.svg", "/listing-transfer.svg"],
  app: ["/preview-dashboard.svg", "/listing-overview.svg", "/listing-growth.svg"],
  gaming: ["/preview-marketplace.svg", "/listing-growth.svg", "/listing-transfer.svg"],
  generic: ["/listing-generic.svg", "/listing-overview.svg", "/listing-diligence.svg"],
};

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.escrowTransaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const [seller, buyer, operator] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Sofia Chen",
        email: "seller@oxlis.dev",
        passwordHash,
        role: "SELLER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Marcus Reed",
        email: "buyer@oxlis.dev",
        passwordHash,
        role: "BUYER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Lina Ortega",
        email: "operator@oxlis.dev",
        passwordHash,
        role: "BOTH",
      },
    }),
  ]);

  const listingDefinitions = [
    {
      id: "promptloop-ai",
      title: "PromptLoop AI",
      summary: "AI workflow SaaS with 14% month-over-month growth and low churn.",
      description: buildDescription([
        {
          title: "Vue d'ensemble",
          body:
            "PromptLoop AI est un SaaS B2B qui automatise la preparation des sequences outbound, l'enrichissement des comptes cibles et la creation de briefs commerciaux pour les equipes growth et revenue. Le produit est aujourd'hui deploye chez 182 comptes payants, principalement en Amerique du Nord et en Europe, avec une base tres saine de clients entre 12 et 85 utilisateurs par compte.",
        },
        {
          title: "Revenus et monetisation",
          body:
            "Le business repose sur des abonnements mensuels et annuels avec trois plans principaux, auxquels s'ajoutent des credits d'usage IA et quelques services d'onboarding factures une seule fois. Le panier moyen a progressé de facon reguliere grace a l'upsell sur les equipes sales et operations, tandis que le churn logo reste faible et que le net revenue retention depasse 110 % sur la cohorte enterprise.",
        },
        {
          title: "Acquisition et croissance",
          body:
            "La croissance est tiree par un melange d'inbound SEO, de contenu produit sur LinkedIn, de partenariats avec des agences RevOps et d'un petit motion outbound tres bien cible. Le pipeline commercial est documente, les principales sequences sont deja ecrites et les meilleures campagnes sont tracees dans le CRM avec historique complet par canal.",
        },
        {
          title: "Operations et transfert",
          body:
            "L'equipe est volontairement legere: le fondateur gere la vision produit, un engineer full-stack maintient la plateforme, et le support client est largement structure par une base documentaire et des workflows internes. La reprise est simple pour un acquereur operateur ou un petit holding SaaS, avec passation prevue sur 4 a 6 semaines, documentation produit, roadmap, playbooks growth et tableau de bord financier inclus.",
        },
      ]),
      imageUrls: galleries.saas,
      niche: "AI SaaS",
      type: "SaaS",
      askingPrice: 420000,
      monthlyRevenue: 28500,
      monthlyProfit: 18200,
      techStack: ["Next.js", "Node.js", "PostgreSQL", "OpenAI"],
      status: "ACTIVE",
      ownerId: seller.id,
    },
    {
      id: "northstar-gear",
      title: "Northstar Gear",
      summary: "Profitable Shopify outdoor brand with strong repeat purchase behavior.",
      description: buildDescription([
        {
          title: "Vue d'ensemble",
          body:
            "Northstar Gear est une marque DTC orientee outdoor qui vend des accessoires premium pour randonnee, bivouac leger et organisation d'equipement. La marque s'est construite autour d'un positionnement simple: produits au design sobre, bonne marge brute, forte repetabilite d'achat et logistique externalisee dans un entrepot tiers fiable.",
        },
        {
          title: "Monetisation et performance",
          body:
            "Le revenu provient majoritairement du site Shopify, complete par quelques ventes wholesale et par des bundles saisonniers. Le panier moyen est soutenu par des packs et des upsells en checkout, tandis que la base clients email est activee avec une excellente frequence de rachat sur les meilleurs SKU. Les marges restent solides malgre les promotions grace a une bonne discipline sur l'assortiment et a des fournisseurs deja negocies.",
        },
        {
          title: "Canaux d'acquisition",
          body:
            "L'acquisition est diversifiee entre Google Ads, Meta, SEO transactionnel, campagnes email et collaborations avec micro-createurs du segment rando et vanlife. Le business n'est pas dependant d'un seul canal et beneficie d'une bonne base organique de clients fideles qui reduit le risque marketing pour un repreneur.",
        },
        {
          title: "Exploitation et reprise",
          body:
            "Les operations quotidiennes sont relativement stables: commandes, support de premier niveau, relation fournisseur et calendrier promotionnel. Tout est documente dans un manuel operatoire avec inventaire, forecast simple, templates publicitaires et procedures de lancement. La marque convient particulierement a un acquereur e-commerce cherchant une base saine a scaler avec plus de capital media ou une gamme elargie.",
        },
      ]),
      imageUrls: galleries.commerce,
      niche: "Outdoor Commerce",
      type: "E-commerce",
      askingPrice: 315000,
      monthlyRevenue: 41000,
      monthlyProfit: 9600,
      techStack: ["Shopify", "Klaviyo", "Google Ads"],
      status: "ACTIVE",
      ownerId: operator.id,
    },
    {
      id: "finscope-media",
      title: "FinScope Media",
      summary: "Finance content portfolio with newsletter, SEO traffic, and sponsorship revenue.",
      description: buildDescription([
        {
          title: "Actif media",
          body:
            "FinScope Media regroupe un site editorial finance, une newsletter hebdomadaire et plusieurs guides evergreen qui captent un trafic organique stable sur des requetes a forte intention. Le portefeuille editorial cible des sujets d'investissement personnel, d'outils de gestion et de culture business, avec une audience majoritairement anglophone mais monetisable a l'international.",
        },
        {
          title: "Sources de revenu",
          body:
            "La monetisation est repartie entre partenariats sponsors, placements newsletter, affiliation sur outils financiers et quelques revenus display residuels. Cette diversification donne une bonne resilience et permet a l'acquereur de pousser soit la ligne sponsors, soit la monétisation affiliate, soit une extension premium via contenu reserve ou abonnements experts.",
        },
        {
          title: "Production et SEO",
          body:
            "La production de contenu est largement outsourcee via un reseau de redacteurs et d'editeurs deja qualifies. Le calendrier editorial, les briefs, le maillage interne et le suivi SEO sont documentes. Les meilleures pages ont une anciennete solide, une bonne autorite et une faible volatilite, ce qui rend l'actif particulierement attractif pour un operateur media.",
        },
        {
          title: "Potentiel d'expansion",
          body:
            "Les leviers les plus evidents sont l'augmentation du CPM sponsor, l'ouverture de segments premium, le lancement de produits d'information et l'extension video ou podcast. La transition est simple: les process editoriaux existent deja, les partenaires monetisation sont actifs et l'audience email reste engagee.",
        },
      ]),
      imageUrls: galleries.content,
      niche: "Finance Media",
      type: "Content",
      askingPrice: 198000,
      monthlyRevenue: 14700,
      monthlyProfit: 11200,
      techStack: ["WordPress", "Beehiiv", "GA4"],
      status: "ACTIVE",
      ownerId: seller.id,
    },
    {
      id: "neuralops-copilot",
      title: "NeuralOps Copilot",
      summary: "Enterprise AI operations suite with usage-based expansion and sticky team workflows.",
      description: buildDescription([
        {
          title: "Positionnement produit",
          body:
            "NeuralOps Copilot est un logiciel B2B oriente operations qui aide les equipes revenue et customer success a preparer les comptes, resumer les signaux clients et prioriser les risques de pipeline. Le produit se vend bien a des organisations de taille moyenne qui veulent des gains de temps mesurables sans mettre en place une couche data trop lourde.",
        },
        {
          title: "Economics et contrats",
          body:
            "La majorite du chiffre d'affaires est sous contrats annuels, avec une logique de seats et quelques modules avances factures en option. Le business beneficie d'une bonne qualite de revenu grace a une base cliente recurrente, des expansions naturelles par equipe et un discours ROI simple a demonstrer en demo comme en renouvellement.",
        },
        {
          title: "Go-to-market",
          body:
            "Le pipeline est alimente par referrals, partenariats RevOps, contenu expert et outbound cible. Les meilleurs deals viennent souvent d'equipes deja convaincues par un cas d'usage precis: renouvellements en retard, preparation des QBR, ou segmentation de risque client. Tous les assets go-to-market sont documentes et transferables.",
        },
        {
          title: "Pourquoi l'actif est defensible",
          body:
            "Au-dela de l'IA, la valeur reside dans l'integration produit, les workflows metier deja construits, la faible friction de mise en route et la profondeur des use cases operations. L'actif convient a un acquereur SaaS qui veut une base enterprise AI plus mature qu'un simple wrapper LLM, avec un historique commercial exploitable et une roadmap deja priorisee.",
        },
      ]),
      imageUrls: galleries.saas,
      niche: "AI SaaS",
      type: "SaaS",
      askingPrice: 540000,
      monthlyRevenue: 36200,
      monthlyProfit: 23100,
      techStack: ["Next.js", "Python", "PostgreSQL", "LangChain"],
      status: "ACTIVE",
      ownerId: seller.id,
    },
    {
      id: "pulsepath-mobile",
      title: "PulsePath Mobile",
      summary: "Subscription wellness tracker with strong App Store ratings and paid acquisition efficiency.",
      description: buildDescription([
        {
          title: "Produit et audience",
          body:
            "PulsePath Mobile est une application mobile de suivi de routine et de bien-etre qui combine habitudes, biomarqueurs, coaching leger et rappels intelligents. L'application cible un public 25-45 ans, tres mobile-first, avec une forte utilisation quotidienne autour des routines sante, du sommeil et de la constance de pratique.",
        },
        {
          title: "Modele economique",
          body:
            "Le revenu provient principalement d'abonnements annuels et mensuels, renforces par une couche premium de coaching et quelques challenges thematiques. Le funnel est clair: acquisition mobile, essai, onboarding guide, conversion subscription puis retention par streaks et contenus personnalises. Les notes stores sont bonnes et la base abonnés montre une retention correcte apres le premier cycle de facturation.",
        },
        {
          title: "Acquisition et retention",
          body:
            "La traction repose sur Apple Search Ads, collaborations avec createurs bien-etre, contenu short-form et referrals in-app. Le churn a ete reduit grace a un onboarding mieux segmente et a des sequences lifecycle qui relancent les utilisateurs selon leurs objectifs. C'est un actif interessant pour un acquereur mobile cherchant un produit sain avec un levier CRO et acquisition encore loin d'etre sature.",
        },
        {
          title: "Transmission",
          body:
            "Le code, les assets, les creatives performantes et les tableaux de bord de cohortes sont transmis avec la vente. La passation prevue couvre ASO, campagnes UA, logique d'abonnement et optimisation des messages in-app. La structure reste relativement legere et bien adaptee a un operateur produit ou a un studio mobile.",
        },
      ]),
      imageUrls: galleries.app,
      niche: "Mobile App",
      type: "App",
      askingPrice: 265000,
      monthlyRevenue: 18400,
      monthlyProfit: 9700,
      techStack: ["Flutter", "Firebase", "RevenueCat", "BigQuery"],
      status: "ACTIVE",
      ownerId: operator.id,
    },
    {
      id: "blockforge-analytics",
      title: "BlockForge Analytics",
      summary: "Web3 intelligence platform selling wallet monitoring and protocol dashboards to funds.",
      description: buildDescription([
        {
          title: "Positionnement Web3",
          body:
            "BlockForge Analytics est une plateforme d'intelligence on-chain qui aide les fonds, desks de trading et equipes protocoles a suivre des wallets, surveiller des tresoreries et construire des rapports decisionnels sur l'activite blockchain. Le produit adresse un besoin metier concret: gagner du temps sur l'analyse, centraliser les flux et produire des signaux actionnables rapidement.",
        },
        {
          title: "Recurrence et clients",
          body:
            "Le revenu est majoritairement contractuel, avec quelques frais d'implementation ou de dashboard personnalise pour les comptes plus avancés. La clientele est relativement experte, ce qui rend le produit moins substituable et moins sensible au bruit de cycle court. L'actif convient a un acquereur qui comprend la valeur d'une stack data verticale et d'une relation B2B a forte confiance.",
        },
        {
          title: "Produit et barriere",
          body:
            "La valeur ne repose pas seulement sur les donnees on-chain mais aussi sur les vues preconstruites, les alertes metier, la lecture portefeuille par portefeuille et la vitesse de mise en place. Les dashboards les plus utiles sont deja identifies et les clients existants s'appuient sur la solution pour leurs revues internes, leur compliance operationnelle et leur monitoring de protocole.",
        },
        {
          title: "Execution et potentiel",
          body:
            "Le potentiel de croissance se situe dans l'ajout de chaines supplementaires, l'upsell alerting, la creation de modules compliance et la monétisation d'insights premium. La reprise inclut la documentation infra, les scripts d'ingestion, la segmentation clients et les cas d'usage commerciaux deja valides.",
        },
      ]),
      imageUrls: galleries.generic,
      niche: "Crypto / Web3",
      type: "Platform",
      askingPrice: 610000,
      monthlyRevenue: 42100,
      monthlyProfit: 18800,
      techStack: ["Next.js", "Solidity", "Node.js", "The Graph"],
      status: "ACTIVE",
      ownerId: seller.id,
    },
    {
      id: "questloop-studios",
      title: "QuestLoop Studios",
      summary: "Live-ops gaming business with battle pass revenue and a loyal Discord community.",
      description: buildDescription([
        {
          title: "Jeu et communaute",
          body:
            "QuestLoop Studios exploite un jeu multijoueur casual avec une forte logique de live-ops. La valeur de l'actif vient autant du jeu lui-meme que de sa communaute Discord, de ses saisons deja cadencées et de ses evenements live qui maintiennent l'engagement. L'audience est repartie entre mobile et PC, ce qui dilue le risque de plateforme unique.",
        },
        {
          title: "Monetisation",
          body:
            "Les revenus proviennent des battle passes, bundles cosmetiques, objets limites et operations saisonnieres. Le design economique n'est pas agressif, ce qui aide a conserver une bonne image de marque aupres de la communaute. Les meilleurs pics de revenu sont correles aux saisons et aux activations communautaires, avec une bonne documentation de ce qui fonctionne.",
        },
        {
          title: "Operations",
          body:
            "Le rythme de production est structure autour de roadmaps trimestrielles, d'assets reutilisables et d'un backlog de contenus deja priorises. L'exploitation quotidienne couvre le support, la moderation, le balancing et quelques ajustements de monetisation. Les dashboards retention, conversion et ARPPU sont transmis avec les outils de moderation et les assets marketing performants.",
        },
        {
          title: "Interet acquereur",
          body:
            "L'actif est pertinent pour un studio cherchant une base active avec communaute deja monétisee, ou pour un operateur jeu souhaitant appliquer une discipline UA, live-ops et contenu plus intensive. Le transfert est rendu plus simple par une communaute stable, une data historique exploitable et une feuille de route deja prete pour les saisons suivantes.",
        },
      ]),
      imageUrls: galleries.gaming,
      niche: "Gaming",
      type: "Game",
      askingPrice: 330000,
      monthlyRevenue: 24800,
      monthlyProfit: 12100,
      techStack: ["Unity", "C#", "PlayFab", "Photon"],
      status: "ACTIVE",
      ownerId: operator.id,
    },
    {
      id: "mentorgrid-campus",
      title: "MentorGrid Campus",
      summary: "B2B learning platform with cohort courses, certification revenue, and low support load.",
      description: buildDescription([
        {
          title: "Positionnement edtech",
          body:
            "MentorGrid Campus est une plateforme de formation orientee upskilling, vendue a la fois en self-serve et en licences equipes. Le produit couvre des cohortes guidees, des certifications et un catalogue croissant de parcours professionnalisants. L'actif est particulierement interessant parce qu'il combine des revenus recurrents education et une structure operationnelle deja stabilisee.",
        },
        {
          title: "Mecanique de revenu",
          body:
            "Le chiffre d'affaires est reparti entre cohortes premium, ventes evergreen, forfaits B2B et renouvellements de certifications. Les entreprises clientes utilisent souvent la plateforme pour des cycles repetes de formation, ce qui cree une base de revenu relativement previsible. Les marges sont soutenues par un mix malin entre contenu pre-enregistre, sessions live ponctuelles et reseau d'instructeurs freelance.",
        },
        {
          title: "Production et support",
          body:
            "Le support est modere grace a une base de connaissance claire, des parcours bien balises et des templates de communication deja en place. Les livrables pedagogiques, process de lancement de cohortes, feedback loops et assets commerciaux sont documentes. Cela permet a un repreneur d'exploiter l'actif sans devoir reinventer l'operation academique.",
        },
        {
          title: "Pistes d'expansion",
          body:
            "L'extension naturelle du business passe par plus de verticales, davantage de ventes entreprises, une internationalisation partielle et un meilleur packaging certification. Le dossier convient a un acquereur education, RH tech ou infoproduit qui veut une base B2B/B2C mixte avec deja une bonne credibilite marche.",
        },
      ]),
      imageUrls: galleries.generic,
      niche: "Education Platform",
      type: "Platform",
      askingPrice: 460000,
      monthlyRevenue: 31800,
      monthlyProfit: 17400,
      techStack: ["Django", "PostgreSQL", "Stripe", "Celery"],
      status: "ACTIVE",
      ownerId: seller.id,
    },
    {
      id: "flexpulse-coach",
      title: "FlexPulse Coach",
      summary: "Fitness subscription app combining training plans, meal tracking, and coach upsells.",
      description: buildDescription([
        {
          title: "Produit et proposition de valeur",
          body:
            "FlexPulse Coach est une application fitness orientee progression, qui combine programmes adaptatifs, suivi nutrition, challenges et options de coaching premium. Le produit cible des utilisateurs qui veulent des routines simples a suivre, une lecture claire de leur progression et un accompagnement leger sans passer par un coaching 100 % manuel.",
        },
        {
          title: "Monetisation",
          body:
            "Le revenu est structure autour d'abonnements, de programmes thématiques et d'upsells coaching. Le business s'appuie sur une bonne repetabilite de l'usage hebdomadaire, avec un mix entre abonnements standards et utilisateurs a plus forte valeur qui montent sur des plans coaching ou des challenges premium saisonniers.",
        },
        {
          title: "Traction et engagement",
          body:
            "L'engagement repose sur des streaks, notifications intelligentes, objectifs hebdomadaires et contenus progressifs selon le niveau. Les canaux d'acquisition les plus performants sont le contenu social, les partenariats coachs et quelques campagnes payantes bien encadrees. La marque est exploitable par un acquereur health-tech ou mobile qui veut pousser la retention et les upsells.",
        },
        {
          title: "Reprise operationnelle",
          body:
            "La vente inclut les assets creatifs, la logique de programmes, les dashboards cohortes, les scripts CRM et les principaux parcours d'onboarding. La passation est adaptee a un repreneur solo ou a un studio mobile, avec un effort produit raisonnable pour continuer la croissance sur des bases deja saines.",
        },
      ]),
      imageUrls: galleries.app,
      niche: "Health / Fitness",
      type: "App",
      askingPrice: 295000,
      monthlyRevenue: 21200,
      monthlyProfit: 10800,
      techStack: ["React Native", "Supabase", "Stripe", "Expo"],
      status: "ACTIVE",
      ownerId: operator.id,
    },
    {
      id: "stacklane-observability",
      title: "Stacklane Observability",
      summary: "Developer tooling SaaS for log pipelines, deployment traces, and incident summaries.",
      description: buildDescription([
        {
          title: "Vue produit",
          body:
            "Stacklane Observability est un SaaS devtools qui centralise logs, traces de deploiement, contextes d'incident et resumés postmortem dans une interface volontairement plus legere que les suites enterprise historiques. La proposition de valeur est tres claire pour les equipes infra et plateforme qui veulent mieux comprendre leurs incidents sans supporter une stack d'observabilite trop lourde.",
        },
        {
          title: "Qualite de revenu",
          body:
            "Le revenu est recurrent, avec une composante seats et une couche volume sur les workloads plus lourds. Le produit se prete bien au modele product-led growth: essais techniques, premiers dashboards rapides, puis expansion par equipe quand le produit devient un reflexe en periode d'incident. Les renouvellements sont bons parce que l'outil s'ancre dans les workflows engineering.",
        },
        {
          title: "Architecture et exploitation",
          body:
            "Le coeur technique est bien structure, avec une stack moderne orientee performance et cout maitrise. Les integrations prioritaires sont deja faites, les principales vues sont identifiees et la documentation technique est exploitable par un repreneur engineer-led. Les tickets produits en attente sont davantage des options de croissance que des corrections critiques.",
        },
        {
          title: "Pourquoi le dossier est fort",
          body:
            "L'actif est defensible parce qu'il combine utilite immediate, usage recurrent, expansion naturelle et cible acheteur qualifie. Un acquereur SaaS, infra ou devtools peut accelerer le go-to-market, enrichir les integrations et augmenter l'ARPA sans repartir de zero. Toute la matiere de reprise existe deja: dashboards, feedback clients, historique produit, pricing et parcours PLG.",
        },
      ]),
      imageUrls: galleries.saas,
      niche: "Developer Tools",
      type: "SaaS",
      askingPrice: 720000,
      monthlyRevenue: 51500,
      monthlyProfit: 30800,
      techStack: ["Go", "ClickHouse", "React", "Docker"],
      status: "ACTIVE",
      ownerId: seller.id,
    },
  ];

  const createdListings = await Promise.all(
    listingDefinitions.map((data) =>
      prisma.listing.create({
        data,
      }),
    ),
  );

  const listingById = Object.fromEntries(createdListings.map((listing) => [listing.id, listing]));
  const aiListing = listingById["promptloop-ai"];
  const commerceListing = listingById["northstar-gear"];
  const contentListing = listingById["finscope-media"];

  const [offerA, offerB, offerC] = await Promise.all([
    prisma.offer.create({
      data: {
        amount: 390000,
        message: "Prepared to move quickly after access to cohort retention and CAC payback.",
        status: "PENDING",
        buyerId: buyer.id,
        listingId: aiListing.id,
      },
    }),
    prisma.offer.create({
      data: {
        amount: 301000,
        message: "Interested in inventory turn and supplier concentration risk.",
        status: "ACCEPTED",
        buyerId: buyer.id,
        listingId: commerceListing.id,
      },
    }),
    prisma.offer.create({
      data: {
        amount: 185000,
        message: "Would like to diligence traffic concentration before moving higher.",
        status: "COUNTERED",
        buyerId: operator.id,
        listingId: contentListing.id,
      },
    }),
  ]);

  await prisma.escrowTransaction.create({
    data: {
      offerId: offerB.id,
      amount: offerB.amount,
      status: "FUNDED",
    },
  });

  const aiConversation = await prisma.conversation.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      listingId: aiListing.id,
    },
  });

  const commerceConversation = await prisma.conversation.create({
    data: {
      buyerId: buyer.id,
      sellerId: operator.id,
      listingId: commerceListing.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: aiConversation.id,
        senderId: buyer.id,
        content: "Can you share MRR by plan and the last six months of logo churn?",
      },
      {
        conversationId: aiConversation.id,
        senderId: seller.id,
        content: "Yes. I have a diligence pack ready with churn, CAC and activation data.",
      },
      {
        conversationId: commerceConversation.id,
        senderId: buyer.id,
        content: "Is the accepted offer enough to reserve the asset while escrow is funded?",
      },
      {
        conversationId: commerceConversation.id,
        senderId: operator.id,
        content: "Yes. The listing stays private while escrow is in funded state.",
      },
    ],
  });

  console.log("Seed complete");
  console.log("Demo accounts:");
  console.log("seller@oxlis.dev / password123");
  console.log("buyer@oxlis.dev / password123");
  console.log("operator@oxlis.dev / password123");
  console.log("Seeded listings:", createdListings.map((listing) => listing.title).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
