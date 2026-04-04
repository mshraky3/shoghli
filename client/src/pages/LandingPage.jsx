import { Link } from 'react-router-dom';
import SyriaFlag from '../components/SyriaFlag';
import './LandingPage.css';

const JOBS = [
    { icon: '⚡', label: 'كهربائي' },
    { icon: '🔧', label: 'سباك' },
    { icon: '🚚', label: 'نقل أثاث' },
    { icon: '🩺', label: 'طبيب' },
    { icon: '🚗', label: 'سائق' },
    { icon: '🔨', label: 'نجار' },
    { icon: '🎨', label: 'دهان' },
    { icon: '✨', label: 'تنظيف' },
    { icon: '🏗️', label: 'بناء' },
    { icon: '⚒️', label: 'حداد' },
    { icon: '🌾', label: 'مزارع' },
    { icon: '👨‍🍳', label: 'طباخ' },
];

const NEWS = [
    {
        date: 'مارس ٢٠٢٦',
        title: 'إطلاق منصة شغلي في سوريا',
        body: 'نعلن بكل فخر عن إطلاق منصة شغلي، أول منصة رقمية متخصصة في تقريب العمّال من أصحاب العمل في سوريا بناءً على الموقع الجغرافي.',
    },
    {
        date: 'قريباً',
        title: 'تطبيق الجوال قادم',
        body: 'نعمل على إصدار تطبيق للهواتف الذكية لتوفير تجربة أفضل وإشعارات فورية عند توافر فرص عمل جديدة قريبة منك.',
    },
    {
        date: 'قريباً',
        title: 'التوسع إلى جميع المحافظات',
        body: 'نعمل على تغطية كامل المحافظات السورية وإضافة خرائط تفصيلية لكل ناحية وقرية في سوريا.',
    },
];

const HOW_STEPS_WORKER = [
    { num: '١', title: 'سجّل موقعك', desc: 'اسمح للمنصة بتحديد موقعك تلقائياً أو حدده يدوياً على الخريطة.' },
    { num: '٢', title: 'اختر مجالات عملك', desc: 'حدد المهن التي تتقنها من قائمة شاملة من الحرف والمهن.' },
    { num: '٣', title: 'انتظر العروض', desc: 'يرى أصحاب العمل القريبون ملفك وبإمكانهم التواصل معك مباشرة.' },
];

const HOW_STEPS_EMPLOYER = [
    { num: '١', title: 'حدد احتياجك', desc: 'اختر المهنة التي تحتاجها والراتب اليومي المناسب لك.' },
    { num: '٢', title: 'ابحث قريباً منك', desc: 'تظهر لك الخريطة جميع العمّال المتاحين في منطقتك فوراً.' },
    { num: '٣', title: 'تواصل مباشرة', desc: 'تواصل مع العامل المناسب برقم هاتفه أو أرسل طلب اتصال.' },
];

const IMAGES = {
    logo: '/imges/logo.ico',
    hero: '/imges/Hero%20image.png',
    categories: '/imges/Worker%20categories.png',
    map: '/imges/Map%20section%20image.png',
    about: '/imges/About%20section.png',
    contact: '/imges/Contact%20section.png',
};

export default function LandingPage() {
    return (
        <div className="landing" dir="rtl">
            <nav className="landing-nav">
                <div className="landing-logo-wrap">
                    <img src={IMAGES.logo} alt="شعار شغلي" className="landing-logo-img" />
                </div>
                <div className="landing-nav-actions">
                    <a href="#how">كيف يعمل</a>
                    <a href="#jobs">المهن</a>
                    <a href="#about">من نحن</a>
                    <a href="#news">أخبار</a>
                    <a href="#contact">تواصل</a>
                    <Link to="/auth" className="landing-cta-sm">سجّل الآن</Link>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="landing-wrap landing-hero-grid">
                    <div className="landing-hero-copy">
                        <div className="landing-pill">
                            <SyriaFlag size={16} /> متاح الآن في سوريا فقط
                        </div>
                        <h1>شغلي تربطك بالفرصة الأقرب إليك</h1>
                        <p>
                            شغلي تُقرّب العمّال من أصحاب العمل عبر خريطة تفاعلية واضحة وسريعة.
                            إذا كنت تبحث عن عمل يومي أو تحتاج فني قريب منك، ستجد الطريق الأقصر للتواصل.
                        </p>
                        <div className="landing-actions">
                            <Link to="/auth" className="landing-btn landing-btn-solid">أبحث عن عامل</Link>
                            <Link to="/auth" className="landing-btn landing-btn-glass">أبحث عن عمل</Link>
                        </div>
                        <div className="landing-tags">
                            <span>مجاني تماماً</span>
                            <span>بدون رسوم</span>
                            <span>تواصل مباشر</span>
                            <span>يعتمد على الموقع</span>
                        </div>
                    </div>

                    <div className="landing-hero-media">
                        <img src={IMAGES.hero} alt="صورة رئيسية لمنصة شغلي" />
                        <div className="landing-float landing-float-top">
                            <small>فرص اليوم</small>
                            <strong>+١٢٠</strong>
                            <p>طلبات عمل قريبة من المستخدمين</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-wrap landing-stats-grid">
                    <div><strong>+٢٠</strong><span>مهنة وحرفة متاحة</span></div>
                    <div><strong>١٤</strong><span>محافظة سورية</span></div>
                    <div><strong>٪١٠٠</strong><span>مجاني وبدون رسوم</span></div>
                    <div><strong>٢٤/٧</strong><span>متاح طوال اليوم</span></div>
                </div>
            </section>

            <section id="how" className="landing-section">
                <div className="landing-wrap">
                    <div className="landing-head">
                        <h2>كيف تعمل المنصة؟</h2>
                        <p>ثلاث خطوات بسيطة تُوصّلك لما تحتاجه</p>
                    </div>
                    <div className="landing-how-grid">
                        <div className="landing-how-card worker">
                            <h3>إذا كنت تبحث عن عمل</h3>
                            {HOW_STEPS_WORKER.map((s) => (
                                <article key={s.num} className="landing-step">
                                    <span>{s.num}</span>
                                    <div>
                                        <h4>{s.title}</h4>
                                        <p>{s.desc}</p>
                                    </div>
                                </article>
                            ))}
                            <Link to="/auth" className="landing-btn landing-btn-solid">سجّل كعامل الآن</Link>
                        </div>

                        <div className="landing-how-card employer">
                            <h3>إذا كنت تبحث عن عامل</h3>
                            {HOW_STEPS_EMPLOYER.map((s) => (
                                <article key={s.num} className="landing-step">
                                    <span>{s.num}</span>
                                    <div>
                                        <h4>{s.title}</h4>
                                        <p>{s.desc}</p>
                                    </div>
                                </article>
                            ))}
                            <Link to="/auth" className="landing-btn landing-btn-success">ابحث عن عامل الآن</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section id="jobs" className="landing-section alt">
                <div className="landing-wrap">
                    <div className="landing-banner-image">
                        <img src={IMAGES.categories} alt="المهن المتاحة على المنصة" />
                        <div>أكثر من ٢٠ فئة عمل جاهزة للظهور والبحث</div>
                    </div>
                    <div className="landing-head">
                        <h2>المهن المتاحة على المنصة</h2>
                        <p>من أعمال المنازل إلى الأطباء والمتخصصين</p>
                    </div>
                    <div className="landing-jobs-grid">
                        {JOBS.map((j) => (
                            <div key={j.label} className="landing-job-card">
                                <div>{j.icon}</div>
                                <strong>{j.label}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="landing-section">
                <div className="landing-wrap landing-two-col">
                    <div>
                        <h2>اعثر على ما تحتاجه في قريتك مباشرة</h2>
                        <p>بحث بالموقع الجغرافي عبر القرية والناحية والمنطقة مع نتائج واضحة وسريعة.</p>
                        <ul className="landing-checks">
                            <li>خريطة تفاعلية</li>
                            <li>نطاق بحث مرن</li>
                            <li>رقم مباشر أو طلب اتصال</li>
                            <li>مصمم للجوال أولاً</li>
                        </ul>
                    </div>
                    <div className="landing-media-card">
                        <img src={IMAGES.map} alt="واجهة الخريطة في شغلي" />
                    </div>
                </div>
            </section>

            <section id="about" className="landing-section dark">
                <div className="landing-wrap landing-two-col">
                    <div>
                        <SyriaFlag size={40} />
                        <h2>من نحن</h2>
                        <p>
                            شغلي منصة رقمية سورية تهدف إلى تقريب المسافة بين العمّال وأصحاب العمل.
                            نركز على البساطة والوضوح وتجربة عربية مناسبة للواقع المحلي.
                        </p>
                        <Link to="/auth" className="landing-btn landing-btn-solid">انضم إلى شغلي مجاناً</Link>
                    </div>
                    <div className="landing-media-card">
                        <img src={IMAGES.about} alt="صورة تعبّر عن مجتمع شغلي" />
                    </div>
                </div>
            </section>

            <section id="news" className="landing-section">
                <div className="landing-wrap">
                    <div className="landing-head">
                        <h2>آخر الأخبار والإعلانات</h2>
                        <p>ابقَ على اطلاع بآخر تطورات المنصة</p>
                    </div>
                    <div className="landing-news-grid">
                        {NEWS.map((n) => (
                            <article key={n.title} className="landing-news-card">
                                <small>{n.date}</small>
                                <h3>{n.title}</h3>
                                <p>{n.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="landing-cta-band">
                <div className="landing-wrap landing-head">
                    <h2>جاهز للبدء؟</h2>
                    <p>سجّل الآن مجاناً وابدأ في إيجاد عمل أو توظيف عمّال في منطقتك</p>
                    <div className="landing-actions">
                        <Link to="/auth" className="landing-btn landing-btn-solid">سجّل كعامل</Link>
                        <Link to="/auth" className="landing-btn landing-btn-glass">سجّل كصاحب عمل</Link>
                    </div>
                </div>
            </section>

            <section id="contact" className="landing-section alt">
                <div className="landing-wrap landing-two-col">
                    <div className="landing-media-card">
                        <img src={IMAGES.contact} alt="صورة تمثل التواصل والدعم في منصة شغلي" />
                    </div>
                    <div>
                        <h2>تواصل معنا</h2>
                        <p>لديك سؤال أو اقتراح؟ يسعدنا سماعك</p>
                        <div className="landing-contact-grid">
                            <article>
                                <strong>📧 البريد الإلكتروني</strong>
                                <span>alshraky3@gmail.com</span>
                            </article>
                            <article>
                                <strong>📱 واتساب</strong>
                                <span>+963 XXX XXX XXX</span>
                            </article>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="landing-logo-wrap landing-logo-wrap-footer">
                    <img src={IMAGES.logo} alt="شعار شغلي" className="landing-logo-img" />
                </div>
                <p>© ٢٠٢٦ شغلي. مصنوع بـ ❤️ لسوريا</p>
                <p>متاح حالياً في سوريا فقط</p>
            </footer>
        </div>
    );
}
