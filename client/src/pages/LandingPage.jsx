import { Link } from 'react-router-dom';

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
    hero: '/imges/Hero%20image.png',
    categories: '/imges/Worker%20categories.png',
    map: '/imges/Map%20section%20image.png',
    about: '/imges/About%20section.png',
    contact: '/imges/Contact%20section.png',
};

export default function LandingPage() {
    return (
        <div style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif", background: 'white', color: '#111827' }}>
            {/* ===== NAV ===== */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'white', borderBottom: '1px solid #e5e7eb',
                padding: '12px 24px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb' }}>شغلي</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <a href="#how" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>كيف يعمل</a>
                    <a href="#jobs" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>المهن</a>
                    <a href="#about" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>من نحن</a>
                    <a href="#news" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>أخبار</a>
                    <a href="#contact" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>تواصل</a>
                    <Link to="/auth" style={{
                        background: '#2563eb', color: 'white',
                        padding: '8px 20px', borderRadius: 8,
                        textDecoration: 'none', fontWeight: 700, fontSize: 15,
                    }}>سجّل الآن</Link>
                </div>
            </nav>

            {/* ===== HERO ===== */}
            <section style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                color: 'white', padding: '72px 24px 96px', overflow: 'hidden',
            }}>
                <div style={{
                    maxWidth: 1180, margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 40, alignItems: 'center',
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)', display: 'inline-block',
                            borderRadius: 50, padding: '6px 20px', marginBottom: 20,
                            fontSize: 14, fontWeight: 600, backdropFilter: 'blur(4px)',
                        }}>
                            🇸🇾 متاح الآن في سوريا فقط
                        </div>
                        <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
                            شغلي تربطك<br />بالفرصة الأقرب إليك
                        </h1>
                        <p style={{ fontSize: 20, opacity: 0.92, maxWidth: 560, marginBottom: 32, lineHeight: 1.8 }}>
                            شغلي تُقرّب العمّال من أصحاب العمل في سوريا عبر خريطة تفاعلية واضحة وسريعة. سواء كنت تبحث عن عمل يومي أو تحتاج كهربائياً أو طبيباً في قريتك، ستجد الطريق الأقصر للتواصل.
                        </p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
                            <Link to="/auth" style={{
                                background: 'white', color: '#1e40af',
                                padding: '16px 40px', borderRadius: 12,
                                textDecoration: 'none', fontWeight: 800,
                                fontSize: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                            }}>
                                🔍 أبحث عن عامل
                            </Link>
                            <Link to="/auth" style={{
                                background: 'rgba(255,255,255,0.15)', color: 'white',
                                padding: '16px 40px', borderRadius: 12,
                                textDecoration: 'none', fontWeight: 800,
                                fontSize: 18, border: '2px solid rgba(255,255,255,0.5)',
                                backdropFilter: 'blur(4px)',
                            }}>
                                💼 أبحث عن عمل
                            </Link>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {['مجاني تماماً', 'بدون رسوم', 'تواصل مباشر', 'يعتمد على الموقع'].map((item) => (
                                <span key={item} style={{
                                    background: 'rgba(255,255,255,0.14)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 999, padding: '8px 14px',
                                    fontSize: 14, fontWeight: 600,
                                }}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ position: 'relative', minHeight: 520 }}>
                        <div style={{
                            position: 'absolute', inset: '30px 0 0 40px',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent 62%)',
                        }} />
                        <img
                            src={IMAGES.hero}
                            alt="صورة رئيسية لمنصة شغلي تُظهر التفاعل بين العامل وصاحب العمل"
                            style={{
                                width: '100%', height: 520, objectFit: 'cover',
                                borderRadius: 28, display: 'block',
                                boxShadow: '0 22px 60px rgba(11, 32, 84, 0.35)',
                                border: '1px solid rgba(255,255,255,0.18)',
                            }}
                        />
                        <div style={{
                            position: 'absolute', top: 24, right: -12,
                            background: 'white', color: '#111827', borderRadius: 18,
                            padding: '14px 16px', minWidth: 180,
                            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                        }}>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>فرص اليوم</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#1e40af' }}>+١٢٠</div>
                            <div style={{ fontSize: 14, color: '#374151' }}>طلبات عمل قريبة من المستخدمين</div>
                        </div>
                        <div style={{
                            position: 'absolute', bottom: 20, left: -12,
                            background: 'rgba(15, 23, 42, 0.82)', color: 'white', borderRadius: 18,
                            padding: '16px 18px', maxWidth: 220,
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                        }}>
                            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>تجربة محلية</div>
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>من الحي إلى الحي</div>
                            <div style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.9 }}>واجهة عربية مصممة لسوريا وبنية قائمة على القرب الجغرافي.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== STATS ===== */}
            <section style={{
                background: '#f8faff', padding: '48px 24px',
                display: 'flex', justifyContent: 'center', gap: 0,
                borderBottom: '1px solid #e5e7eb',
            }}>
                {[
                    { num: '+٢٠', label: 'مهنة وحرفة متاحة' },
                    { num: '١٤', label: 'محافظة سورية' },
                    { num: '٪١٠٠', label: 'مجاني وبدون رسوم' },
                    { num: '٢٤/٧', label: 'متاح طوال اليوم' },
                ].map((s, i) => (
                    <div key={i} style={{
                        flex: 1, textAlign: 'center', padding: '16px 8px',
                        borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none',
                    }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#2563eb' }}>{s.num}</div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section id="how" style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>كيف تعمل المنصة؟</h2>
                    <p style={{ color: '#6b7280', fontSize: 17 }}>ثلاث خطوات بسيطة تُوصّلك لما تحتاجه</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                    {/* Worker side */}
                    <div>
                        <div style={{
                            background: '#eff6ff', borderRadius: 16, padding: '24px',
                            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            <span style={{ fontSize: 28 }}>💼</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18 }}>إذا كنت تبحث عن عمل</div>
                                <div style={{ color: '#6b7280', fontSize: 14 }}>سجّل ملفك مرة واحدة وانتظر العروض</div>
                            </div>
                        </div>
                        {HOW_STEPS_WORKER.map((s) => (
                            <div key={s.num} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
                                <div style={{
                                    minWidth: 40, height: 40, borderRadius: '50%',
                                    background: '#2563eb', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 900, fontSize: 18,
                                }}>
                                    {s.num}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.title}</div>
                                    <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
                                </div>
                            </div>
                        ))}
                        <Link to="/auth" style={{
                            display: 'block', textAlign: 'center',
                            background: '#2563eb', color: 'white',
                            padding: '14px', borderRadius: 10,
                            textDecoration: 'none', fontWeight: 700, fontSize: 16,
                        }}>سجّل كعامل الآن</Link>
                    </div>
                    {/* Employer side */}
                    <div>
                        <div style={{
                            background: '#f0fdf4', borderRadius: 16, padding: '24px',
                            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            <span style={{ fontSize: 28 }}>🔍</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18 }}>إذا كنت تبحث عن عامل</div>
                                <div style={{ color: '#6b7280', fontSize: 14 }}>ابحث واجد العامل المناسب في دقائق</div>
                            </div>
                        </div>
                        {HOW_STEPS_EMPLOYER.map((s) => (
                            <div key={s.num} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
                                <div style={{
                                    minWidth: 40, height: 40, borderRadius: '50%',
                                    background: '#16a34a', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 900, fontSize: 18,
                                }}>
                                    {s.num}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.title}</div>
                                    <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
                                </div>
                            </div>
                        ))}
                        <Link to="/auth" style={{
                            display: 'block', textAlign: 'center',
                            background: '#16a34a', color: 'white',
                            padding: '14px', borderRadius: 10,
                            textDecoration: 'none', fontWeight: 700, fontSize: 16,
                        }}>ابحث عن عامل الآن</Link>
                    </div>
                </div>
            </section>

            {/* ===== JOBS GRID ===== */}
            <section id="jobs" style={{ background: '#f8faff', padding: '80px 24px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{
                        position: 'relative', marginBottom: 36, borderRadius: 24, overflow: 'hidden',
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                    }}>
                        <img
                            src={IMAGES.categories}
                            alt="صورة تعرض مجموعة من المهن والحرف المتاحة على منصة شغلي"
                            style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(180deg, rgba(17,24,39,0.12), rgba(17,24,39,0.65))',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            padding: 24,
                        }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.9)', color: '#111827',
                                padding: '14px 18px', borderRadius: 16, fontWeight: 800,
                                boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
                            }}>
                                أكثر من ٢٠ فئة عمل جاهزة للظهور والبحث
                            </div>
                        </div>
                    </div>
                    <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>المهن المتاحة على المنصة</h2>
                    <p style={{ color: '#6b7280', fontSize: 17, marginBottom: 48 }}>من أعمال المنازل إلى الأطباء والمتخصصين</p>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 16, marginBottom: 40,
                    }}>
                        {JOBS.map((j) => (
                            <div key={j.label} style={{
                                background: 'white', borderRadius: 14,
                                padding: '20px 12px', textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                border: '1px solid #e5e7eb',
                            }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>{j.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{j.label}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 15 }}>
                        +٨ مهن أخرى: خياط، حلاق، معلم خصوصي، صيدلاني، حارس أمن...
                    </p>
                    <Link to="/auth" style={{
                        background: '#2563eb', color: 'white',
                        padding: '14px 40px', borderRadius: 10,
                        textDecoration: 'none', fontWeight: 700, fontSize: 17,
                        display: 'inline-block',
                    }}>سجّل وابدأ الآن مجاناً</Link>
                </div>
            </section>

            {/* ===== MAP PROMO ===== */}
            <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
                    <div>
                        <div style={{
                            background: '#eff6ff', borderRadius: 12,
                            padding: '6px 16px', display: 'inline-block',
                            marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#2563eb',
                        }}>
                            📍 مبني على الخريطة
                        </div>
                        <h2 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.3, marginBottom: 16 }}>
                            اعثر على ما تحتاجه<br />في قريتك مباشرة
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
                            لا تحتاج للسفر أو السؤال. شغلي تُظهر لك على خريطة تفاعلية جميع العمّال المتاحين في قريتك، ناحيتك، أو منطقتك — كل شيء بدقة وسرعة.
                        </p>
                        <ul style={{ color: '#374151', fontSize: 15, lineHeight: 2, paddingRight: 20 }}>
                            <li>✅ خريطة تفاعلية مثل Snapchat</li>
                            <li>✅ بحث حسب القرية أو المنطقة أو المحافظة</li>
                            <li>✅ رقم الهاتف مباشرة أو طلب اتصال</li>
                            <li>✅ يعمل على الجوال بالكامل</li>
                        </ul>
                        <Link to="/auth" style={{
                            display: 'inline-block', marginTop: 28,
                            background: '#2563eb', color: 'white',
                            padding: '14px 32px', borderRadius: 10,
                            textDecoration: 'none', fontWeight: 700, fontSize: 16,
                        }}>جرّب الخريطة الآن</Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={IMAGES.map}
                            alt="واجهة الخريطة في شغلي لإظهار العمال القريبين من المستخدم"
                            style={{
                                width: '100%', height: 520, objectFit: 'cover', display: 'block',
                                borderRadius: 24, boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
                            }}
                        />
                        <div style={{
                            position: 'absolute', top: 18, left: 18,
                            background: 'rgba(255,255,255,0.96)', borderRadius: 16,
                            padding: '12px 16px', minWidth: 190,
                            boxShadow: '0 10px 26px rgba(0,0,0,0.12)',
                        }}>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>خريطة سوريا التفاعلية</div>
                            <div style={{ fontWeight: 900, color: '#1e40af', fontSize: 22 }}>٢٦ محافظة</div>
                            <div style={{ fontSize: 14, color: '#374151', marginTop: 4 }}>مئات القرى والنواحي ضمن نطاق البحث</div>
                        </div>
                        <div style={{
                            position: 'absolute', right: 18, bottom: 18,
                            background: 'rgba(17,24,39,0.84)', color: 'white',
                            borderRadius: 16, padding: '14px 16px', width: 220,
                            backdropFilter: 'blur(6px)',
                        }}>
                            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>عمّال قريبون منك الآن</div>
                            {['كهربائي - ٢.٣ كم', 'سباك - ٤.١ كم', 'طبيب - ٦.٨ كم'].map(w => (
                                <div key={w} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
                                    fontSize: 14,
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                                    {w}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ABOUT ===== */}
            <section id="about" style={{ background: '#111827', color: 'white', padding: '80px 24px' }}>
                <div style={{
                    maxWidth: 1100, margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 36, alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontSize: 48, marginBottom: 20 }}>🇸🇾</div>
                        <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 20 }}>من نحن</h2>
                        <p style={{ fontSize: 17, lineHeight: 1.9, color: '#d1d5db', marginBottom: 24 }}>
                            شغلي هي منصة رقمية سورية تهدف إلى تقريب المسافة بين العمّال وأصحاب العمل. نؤمن أن كل شخص يستحق أن يجد عملاً كريماً بالقرب من منزله، وأن كل صاحب عمل يستطيع إيجاد الكفاءة التي يحتاجها في محيطه مباشرة.
                        </p>
                        <p style={{ fontSize: 17, lineHeight: 1.9, color: '#d1d5db', marginBottom: 32 }}>
                            أُسّست المنصة بهدف خدمة المناطق التي تفتقر إلى فرص العمل الرقمية، مع التركيز على البساطة واللغة العربية وسهولة الاستخدام للجميع.
                        </p>
                        <Link to="/auth" style={{
                            background: '#2563eb', color: 'white',
                            padding: '16px 48px', borderRadius: 12,
                            textDecoration: 'none', fontWeight: 800, fontSize: 18,
                            display: 'inline-block',
                        }}>انضم إلى شغلي مجاناً</Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={IMAGES.about}
                            alt="صورة تعبّر عن مجتمع شغلي وقرب فرص العمل من الناس"
                            style={{ width: '100%', height: 420, objectFit: 'cover', borderRadius: 24, display: 'block' }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 18, right: 18,
                            background: 'rgba(17,24,39,0.82)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 18, padding: '16px 18px', maxWidth: 240,
                            backdropFilter: 'blur(6px)',
                        }}>
                            <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 6 }}>رؤية المنصة</div>
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>تقريب الفرصة من الناس</div>
                            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#d1d5db' }}>منصة عملية وسريعة تحترم الواقع المحلي وتبني الثقة بالوضوح والقرب.</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="news" style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>آخر الأخبار والإعلانات</h2>
                    <p style={{ color: '#6b7280', fontSize: 17 }}>ابقَ على اطلاع بآخر تطورات المنصة</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {NEWS.map((n) => (
                        <div key={n.title} style={{
                            background: 'white', borderRadius: 16, padding: '28px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                            border: '1px solid #e5e7eb',
                        }}>
                            <div style={{
                                fontSize: 13, color: '#2563eb', fontWeight: 700,
                                marginBottom: 12, background: '#eff6ff',
                                display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                            }}>
                                {n.date}
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, lineHeight: 1.4 }}>{n.title}</h3>
                            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{n.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== CTA BAND ===== */}
            <section style={{
                background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                color: 'white', padding: '72px 24px', textAlign: 'center',
            }}>
                <h2 style={{ fontSize: 38, fontWeight: 900, marginBottom: 16 }}>جاهز للبدء؟</h2>
                <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                    سجّل الآن مجاناً وابدأ في إيجاد عمل أو توظيف عمّال في منطقتك
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/auth" style={{
                        background: 'white', color: '#1e40af',
                        padding: '16px 48px', borderRadius: 12,
                        textDecoration: 'none', fontWeight: 800, fontSize: 18,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    }}>سجّل كعامل</Link>
                    <Link to="/auth" style={{
                        background: 'rgba(255,255,255,0.15)', color: 'white',
                        padding: '16px 48px', borderRadius: 12,
                        textDecoration: 'none', fontWeight: 800, fontSize: 18,
                        border: '2px solid rgba(255,255,255,0.5)',
                    }}>سجّل كصاحب عمل</Link>
                </div>
            </section>

            {/* ===== CONTACT ===== */}
            <section id="contact" style={{ padding: '80px 24px', background: '#f8faff' }}>
                <div style={{
                    maxWidth: 1080, margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 32, alignItems: 'center',
                }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={IMAGES.contact}
                            alt="صورة تمثل التواصل والدعم في منصة شغلي"
                            style={{ width: '100%', height: 420, objectFit: 'cover', borderRadius: 24, display: 'block' }}
                        />
                        <div style={{
                            position: 'absolute', inset: 'auto 18px 18px 18px',
                            background: 'rgba(255,255,255,0.94)', borderRadius: 18,
                            padding: '14px 16px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                        }}>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>دعم واستفسارات</div>
                            <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>نرد على الاقتراحات والأسئلة المتعلقة بالمنصة</div>
                            <div style={{ fontSize: 14, color: '#374151' }}>التواصل المباشر يساعدنا على تطوير شغلي بما يناسب المستخدمين في سوريا.</div>
                        </div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>تواصل معنا</h2>
                        <p style={{ color: '#6b7280', fontSize: 17, marginBottom: 32 }}>
                            لديك سؤال أو اقتراح؟ يسعدنا سماعك
                        </p>
                        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                            {[
                                { icon: '📧', label: 'البريد الإلكتروني', value: 'alshraky3@gmail.com' },
                                { icon: '📱', label: 'واتساب', value: '+963 XXX XXX XXX' },
                            ].map(c => (
                                <div key={c.label} style={{
                                    background: 'white', borderRadius: 14, padding: '24px 32px',
                                    border: '1px solid #e5e7eb', boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
                                    flex: 1, minWidth: 220,
                                }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.label}</div>
                                    <div style={{ color: '#2563eb', fontSize: 14, direction: 'ltr' }}>{c.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer style={{ background: '#111827', color: '#9ca3af', padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 12 }}>شغلي</div>
                <p style={{ fontSize: 14, marginBottom: 8 }}>
                    © ٢٠٢٦ شغلي. مصنوع بـ ❤️ لسوريا
                </p>
                <p style={{ fontSize: 13 }}>متاح حالياً في سوريا فقط</p>
            </footer>
        </div >
    );
}
