import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'شغلي - ابحث عن عمل قريب منك';
const DEFAULT_DESCRIPTION = 'شغلي منصة لربط أصحاب العمل بالعمّال القريبين منك بسرعة وسهولة.';
const SITE_NAME = 'شغلي';
const FALLBACK_ORIGIN = 'https://shoghli.vercel.app';
const STRUCTURED_DATA_ID = 'shoghli-seo-jsonld';

const ROUTE_SEO = {
    '/': {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        index: true,
    },
    '/terms': {
        title: 'الشروط والأحكام | شغلي',
        description: 'الشروط والأحكام الخاصة باستخدام منصة شغلي.',
        index: true,
    },
    '/auth': {
        title: 'تسجيل الدخول | شغلي',
        description: 'تسجيل الدخول إلى منصة شغلي عبر رقم الهاتف.',
        index: false,
    },
    '/dashboard': {
        title: 'لوحة التحكم | شغلي',
        description: 'لوحة التحكم الخاصة بك على منصة شغلي.',
        index: false,
    },
    '/profile': {
        title: 'الحساب الشخصي | شغلي',
        description: 'إدارة الحساب الشخصي والإعدادات في شغلي.',
        index: false,
    },
    '/notifications': {
        title: 'الإشعارات | شغلي',
        description: 'إشعاراتك على منصة شغلي.',
        index: false,
    },
    '/requests': {
        title: 'طلبات الاتصال | شغلي',
        description: 'إدارة طلبات الاتصال على منصة شغلي.',
        index: false,
    },
    '/job/new': {
        title: 'نشر وظيفة جديدة | شغلي',
        description: 'أضف فرصة عمل جديدة بسرعة عبر منصة شغلي.',
        index: false,
    },
    '/onboarding/role': {
        title: 'اختيار الدور | شغلي',
        description: 'اختيار دورك لإكمال الإعداد في منصة شغلي.',
        index: false,
    },
    '/onboarding/worker': {
        title: 'إعداد حساب العامل | شغلي',
        description: 'إكمال إعداد حساب العامل في منصة شغلي.',
        index: false,
    },
    '/onboarding/employer': {
        title: 'إعداد حساب صاحب العمل | شغلي',
        description: 'إكمال إعداد حساب صاحب العمل في منصة شغلي.',
        index: false,
    },
    '/admin': {
        title: 'لوحة المدير | شغلي',
        description: 'لوحة الإدارة الخاصة بمنصة شغلي.',
        index: false,
    },
};

function setMetaByName(name, content) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function setMetaByProperty(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    link.setAttribute('href', url);
}

function setStructuredData(data) {
    let scriptTag = document.getElementById(STRUCTURED_DATA_ID);
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = STRUCTURED_DATA_ID;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(data);
}

function removeStructuredData() {
    const scriptTag = document.getElementById(STRUCTURED_DATA_ID);
    if (scriptTag) scriptTag.remove();
}

function getSeoForPath(pathname, isLoggedIn) {
    if (pathname.startsWith('/profile/') && pathname !== '/profile') {
        return {
            title: 'الملف الشخصي | شغلي',
            description: 'عرض ملف المستخدم على منصة شغلي.',
            index: false,
        };
    }

    const exact = ROUTE_SEO[pathname];
    if (exact) return exact;

    return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        index: !isLoggedIn,
    };
}

export default function SeoManager({ user }) {
    const location = useLocation();

    useEffect(() => {
        const isLoggedIn = Boolean(user);
        const seo = getSeoForPath(location.pathname, isLoggedIn);

        const origin = window.location.origin || FALLBACK_ORIGIN;
        const canonicalUrl = `${origin}${location.pathname}`;

        document.title = seo.title;

        setMetaByName('description', seo.description);
        setMetaByName('robots', seo.index ? 'index,follow' : 'noindex,nofollow');

        setMetaByProperty('og:title', seo.title);
        setMetaByProperty('og:description', seo.description);
        setMetaByProperty('og:url', canonicalUrl);
        setMetaByProperty('og:site_name', SITE_NAME);

        setMetaByName('twitter:title', seo.title);
        setMetaByName('twitter:description', seo.description);

        setCanonical(canonicalUrl);

        if (seo.index) {
            const schema = {
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'Organization',
                        name: SITE_NAME,
                        url: origin,
                        logo: `${origin}/imges/logo.ico`,
                    },
                    {
                        '@type': 'WebSite',
                        name: SITE_NAME,
                        url: origin,
                        inLanguage: 'ar',
                        description: DEFAULT_DESCRIPTION,
                    },
                    {
                        '@type': 'WebPage',
                        name: seo.title,
                        url: canonicalUrl,
                        description: seo.description,
                        inLanguage: 'ar',
                        isPartOf: {
                            '@type': 'WebSite',
                            name: SITE_NAME,
                            url: origin,
                        },
                    },
                ],
            };
            setStructuredData(schema);
        } else {
            removeStructuredData();
        }
    }, [location.pathname, user]);

    return null;
}
