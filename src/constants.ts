import { 
  Construction, 
  Paintbrush, 
  Zap, 
  Droplets, 
  Hammer,
  TrendingDown,
  ShoppingCart,
  Package
} from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: string;
  description: string;
  features: string[];
  stock?: number;
}

export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400';

export interface Category {
  id: string;
  name: string;
  icon: any;
}

export const CATEGORIES: Category[] = [
  { id: 'cimento', name: 'Cimento', icon: Construction },
  { id: 'tintas', name: 'Tintas', icon: Paintbrush },
  { id: 'eletrica', name: 'Elétrica', icon: Zap },
  { id: 'hidraulica', name: 'Hidráulica', icon: Droplets },
  { id: 'ferramentas', name: 'Ferramentas', icon: Hammer },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cauê 50Kg CPII F-32',
    price: 32.50,
    category: 'cimento',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
    description: 'Cimento de alta qualidade, indicado para obras estruturais que exigem resistência e durabilidade. Ideal para fundações, pilares e lajes, garantindo desempenho superior e segurança na construção. Embalagem de 50Kg, perfeita para grandes projetos.',
    features: ['Secagem rápida', 'Alta resistência', 'Saco de 50kg']
  },
  {
    id: '2',
    name: 'Votoran 25Kg Todas as Obras',
    price: 22.90,
    category: 'cimento',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
    description: 'Versátil e prático, pode ser utilizado em diferentes etapas da obra, desde pequenas reformas até construções completas. Embalagem de 25Kg que facilita o transporte e manuseio, mantendo a confiabilidade da marca Votoran.',
    features: ['Fácil de misturar', 'Ideal para pequenos reparos', 'Saco de 25kg']
  },
  {
    id: '3',
    name: 'Suvinil Rende & Cobre Muito Branco 18L',
    price: 389.00,
    category: 'tintas',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
    description: 'Tinta premium com excelente cobertura e rendimento, reduzindo a necessidade de múltiplas demãos. Indicada para ambientes internos e externos, proporciona acabamento uniforme e cores vivas que valorizam qualquer espaço.',
    features: ['Excelente acabamento', 'Lavável', 'Rendimento superior']
  },
  {
    id: '4',
    name: 'Futura Super Rendimento Branco 18L',
    price: 315.00,
    category: 'tintas',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
    description: 'Opção econômica sem abrir mão da qualidade. Indicada para quem busca praticidade e bom custo-benefício, com ótimo poder de cobertura e durabilidade em paredes internas e externas.',
    features: ['Baixo respingo', 'Secagem rápida', 'Ótimo custo-benefício']
  },
  {
    id: '5',
    name: 'Disjuntor 32A Bipolar Steck',
    price: 45.90,
    category: 'eletrica',
    image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&q=80&w=400',
    description: 'Protege instalações elétricas contra sobrecargas e curtos-circuitos. Indicado para sistemas residenciais e comerciais, garantindo segurança e confiabilidade. Produto da marca Steck, referência em qualidade elétrica.',
    features: ['Segurança garantida', 'Fácil instalação', 'Alta sensibilidade']
  },
  {
    id: '6',
    name: 'Barramento Pente de Ligação 12 Polos Bipolar',
    price: 38.00,
    category: 'eletrica',
    image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&q=80&w=400',
    description: 'Facilita a distribuição elétrica em quadros de energia, proporcionando organização e rapidez na instalação. Indicado para profissionais que buscam eficiência e segurança em projetos elétricos.',
    features: ['Organização do quadro', 'Conexão segura', '12 polos']
  },
  {
    id: '7',
    name: 'Cotovelo Soldável 25mm 90⁰ Tigre',
    price: 2.50,
    category: 'hidraulica',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
    description: 'Conexão resistente e prática para mudanças de direção em tubulações. Indicado para sistemas hidráulicos residenciais e comerciais, garantindo vedação perfeita e durabilidade.',
    features: ['Marca líder', 'Fácil soldagem', 'Durabilidade Tigre']
  },
  {
    id: '8',
    name: 'Tubo Soldável 25mm Tigre 6m',
    price: 28.90,
    category: 'hidraulica',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
    description: 'Tubo confiável para condução de água fria em instalações hidráulicas. Fácil de instalar, resistente e durável, ideal para projetos que exigem qualidade e segurança.',
    features: ['Resistente a pressão', 'Norma ABNT', 'Barra de 6 metros']
  },
  {
    id: '9',
    name: 'Serra Mármore Stanley 1200W 220V',
    price: 349.00,
    category: 'ferramentas',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400',
    description: 'Ferramenta potente e precisa para cortes em pisos, revestimentos e pedras. Indicada para profissionais da construção e reformas, garantindo acabamento de qualidade e alta performance.',
    features: ['Motor potente', 'Corte ajustável', 'Garantia Stanley']
  },
  {
    id: '10',
    name: 'Parafusadeira Stanley 20V 2 Baterias',
    price: 799.00,
    category: 'ferramentas',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=400',
    description: 'Equipamento versátil para montagem e manutenção. Vem com duas baterias para maior autonomia, ideal para trabalhos contínuos. Indicada para uso profissional e doméstico, oferecendo praticidade e eficiência.',
    features: ['Sem fio', 'Alta autonomia', 'Maleta inclusa']
  }
];

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'promo' | 'cart' | 'stock';
  icon: any;
  time: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Oportunidade!',
    message: 'O Cimento CP-II que você salvou baixou de preço! De R$ 38,90 por R$ 34,90.',
    type: 'promo',
    icon: TrendingDown,
    time: '2h atrás'
  },
  {
    id: 'n2',
    title: 'Carrinho Esquecido',
    message: 'Você deixou itens no seu carrinho. Finalize agora e garanta o estoque!',
    type: 'cart',
    icon: ShoppingCart,
    time: '5h atrás'
  },
  {
    id: 'n3',
    title: 'Novo Estoque',
    message: 'As torneiras gourmet que você procurava acabaram de chegar!',
    type: 'stock',
    icon: Package,
    time: 'Ontem'
  }
];
