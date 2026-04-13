export type ListingVisual = {
  src: string;
  label: string;
  title: string;
  caption: string;
};

type ListingVisualInput = {
  title: string;
  summary: string;
  type: string;
  niche: string;
  techStack: string[];
  imageUrls?: string[];
};

function getCustomSlides(input: ListingVisualInput): ListingVisual[] | null {
  if (!input.imageUrls || input.imageUrls.length === 0) {
    return null;
  }

  const fallbackSlides = [
    {
      label: input.niche,
      title: input.title,
      caption: input.summary,
    },
    {
      label: "Vue d'ensemble",
      title: "Vue d'ensemble de l'acquisition",
      caption: `Vue generale de ${input.title} avec contexte, positionnement et traction du dossier.`,
    },
    {
      label: "Croissance",
      title: "Traction et signaux de croissance",
      caption: `Lecture orientee croissance pour ${input.title}, avec ses moteurs d'acquisition et ses KPI clefs.`,
    },
    {
      label: "Due diligence",
      title: "Documentation et audit rapide",
      caption: `Projection diligence sur ${input.title} pour examiner operations, finance et passation.`,
    },
    {
      label: "Transmission",
      title: "Passation et leviers post-acquisition",
      caption: `Apercu des actifs transmis et des leviers de reprise pour ${input.title}.`,
    },
  ];

  return input.imageUrls.map((src, index) => {
    const fallback = fallbackSlides[index] ?? {
      label: `Visuel ${index + 1}`,
      title: `${input.title} · visuel ${index + 1}`,
      caption: input.summary,
    };

    return {
      src,
      label: fallback.label,
      title: fallback.title,
      caption: fallback.caption,
    };
  });
}

function getPrimaryListingVisual({ type, niche, techStack }: ListingVisualInput): ListingVisual {
  const fingerprint = `${type} ${niche} ${techStack.join(" ")}`.toLowerCase();

  if (/(mobile app|flutter|react native|ios|android|swift|kotlin)/.test(fingerprint)) {
    return {
      src: "/listing-overview.svg",
      label: "Mobile app",
      title: "Application mobile et retention",
      caption: "Vue produit mobile pour mettre en avant abonnements, retention et usage quotidien.",
    };
  }

  if (/(crypto|web3|wallet|defi|solidity|on-chain)/.test(fingerprint)) {
    return {
      src: "/listing-transfer.svg",
      label: "Web3 infra",
      title: "Pipeline crypto et operations on-chain",
      caption: "Apercu Web3 pour visualiser dashboards protocoles, portefeuille clients et usage infra.",
    };
  }

  if (/(gaming|game|unity|playfab|photon|discord)/.test(fingerprint)) {
    return {
      src: "/listing-growth.svg",
      label: "Gaming",
      title: "Live ops, revenus et communaute",
      caption: "Lecture gaming orientee monetisation, retention des joueurs et operation des saisons.",
    };
  }

  if (/(education|edtech|learning|academy|course|cohort|certification)/.test(fingerprint)) {
    return {
      src: "/listing-diligence.svg",
      label: "EdTech",
      title: "Plateforme education et cohortes",
      caption: "Projection education pour presenter catalogue, licences equipe et monetisation des certifications.",
    };
  }

  if (/(health|fitness|wellness|workout|nutrition|coach)/.test(fingerprint)) {
    return {
      src: "/listing-generic.svg",
      label: "Health tech",
      title: "Application sante et engagement",
      caption: "Apercu sante et fitness centre sur abonnements, engagement et coaching premium.",
    };
  }

  if (/(developer tools|devtools|observability|sdk|api|cli|docker|clickhouse|go)/.test(fingerprint)) {
    return {
      src: "/listing-content.svg",
      label: "Developer tools",
      title: "Outils dev et workflows techniques",
      caption: "Vue orientee equipe engineering pour presenter adoption produit, telemetry et expansion B2B.",
    };
  }

  if (/(e-commerce|ecommerce|shopify|commerce|boutique|retail)/.test(fingerprint)) {
    return {
      src: "/listing-ecommerce.svg",
      label: "Commerce en ligne",
      title: "Vitrine acquisition e-commerce",
      caption: "Apercu retail avec merchandising, tunnel d'achat et leviers de conversion.",
    };
  }

  if (/(content|contenu|media|newsletter|seo|blog|publishing)/.test(fingerprint)) {
    return {
      src: "/listing-content.svg",
      label: "Media & audience",
      title: "Media, audience et newsletter",
      caption: "Projection editoriale pour visualiser contenu, trafic organique et monetisation.",
    };
  }

  if (/(saas|software|application|app|ia|ai|automation|plateforme)/.test(fingerprint)) {
    return {
      src: "/listing-saas.svg",
      label: "Produit logiciel",
      title: "Interface produit et revenus recurrents",
      caption: "Apercu SaaS pour mettre en avant pricing, retention et usage du produit.",
    };
  }

  return {
    src: "/listing-generic.svg",
    label: "Business digital",
    title: "Apercu global de l'actif numerique",
    caption: "Vue neutre pour presenter l'entreprise, ses operations et sa traction.",
  };
}

export function getListingVisual(input: ListingVisualInput): ListingVisual {
  const customSlides = getCustomSlides(input);
  if (customSlides && customSlides.length > 0) {
    return customSlides[0];
  }

  return getPrimaryListingVisual(input);
}

export function getListingGallery(input: ListingVisualInput): ListingVisual[] {
  const customSlides = getCustomSlides(input);
  if (customSlides && customSlides.length > 0) {
    return customSlides;
  }

  const primary = getPrimaryListingVisual(input);

  return [
    primary,
    {
      src: "/listing-overview.svg",
      label: "Vue d'ensemble",
      title: "Vue d'ensemble de l'acquisition",
      caption: `Parcours synthese pour lire ${input.niche.toLowerCase()} sous l'angle deal, traction et execution.`,
    },
    {
      src: "/listing-growth.svg",
      label: "Croissance",
      title: "Traction et signaux de croissance",
      caption: "Mockup additionnel pour tester le defilement avec une vue orientee croissance et performance.",
    },
    {
      src: "/listing-diligence.svg",
      label: "Due diligence",
      title: "Documentation et audit rapide",
      caption: "Vue grand format pour parcourir les KPI, le contexte operatif et la preparation a la transmission.",
    },
    {
      src: "/listing-transfer.svg",
      label: "Transmission",
      title: "Passation et leviers post-acquisition",
      caption: `Slide de test supplementaire pour defiler plusieurs visuels autour de ${input.type.toLowerCase()}.`,
    },
  ];
}