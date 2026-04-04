import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function TermsPage() {
    const navigate = useNavigate();

    return (
        <div className="page" style={{ background: 'white' }}>
            <div style={{
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--gray-200)',
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowRight size={22} />
                </button>
                <h1 style={{ fontSize: 18, fontWeight: 700 }}>الشروط والأحكام</h1>
            </div>

            <div className="container" style={{ lineHeight: 2, fontSize: 15, color: 'var(--gray-700)' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: 'var(--gray-900)' }}>
                    شروط وأحكام استخدام منصة شغلي
                </h2>
                <p style={{ color: 'var(--gray-400)', marginBottom: 24, fontSize: 13 }}>
                    آخر تحديث: أبريل 2026
                </p>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>1. المقدمة</h3>
                    <p>مرحباً بك في منصة "شغلي". باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. يُرجى قراءتها بعناية قبل استخدام المنصة.</p>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>2. طبيعة المنصة</h3>
                    <p>شغلي هي منصة إلكترونية تهدف إلى التوسط بين العمال وأصحاب العمل في سوريا. المنصة ليست طرفاً في أي عقد عمل أو اتفاق بين المستخدمين، وإنما تُقدم خدمة الربط فقط.</p>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>3. الاستخدام المسموح</h3>
                    <ul style={{ paddingRight: 20 }}>
                        <li>يجب استخدام المنصة لأغراض البحث عن عمل أو توظيف فقط.</li>
                        <li>يُمنع منعاً باتاً استخدام المنصة لأغراض التعارف أو المواعدة أو غيرها من الاستخدامات غير المتعلقة بالعمل.</li>
                        <li>يُمنع إرسال رسائل أو محتوى غير لائق أو مسيء أو تحرشي.</li>
                        <li>يُمنع نشر معلومات كاذبة أو مضللة عن المؤهلات أو الخبرات.</li>
                        <li>يُمنع استخدام المنصة لأي نشاط غير قانوني.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>4. حسابات المستخدمين</h3>
                    <ul style={{ paddingRight: 20 }}>
                        <li>كل مستخدم مسؤول عن الحفاظ على أمان حسابه.</li>
                        <li>يجب تقديم معلومات صحيحة ودقيقة عند التسجيل.</li>
                        <li>يحق للمنصة تعليق أو حذف أي حساب ينتهك هذه الشروط دون إنذار مسبق.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>5. نظام البلاغات والحظر</h3>
                    <ul style={{ paddingRight: 20 }}>
                        <li>يحق لأي مستخدم الإبلاغ عن مستخدم آخر عند مخالفة الشروط.</li>
                        <li>عند تلقي 3 بلاغات أو أكثر من مستخدمين مختلفين، سيتم حظر الحساب تلقائياً.</li>
                        <li>يحق لإدارة المنصة مراجعة البلاغات واتخاذ القرار المناسب.</li>
                        <li>يمكن للمستخدم المحظور التقدم بطلب استئناف عبر البريد الإلكتروني.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>6. نظام التقييم</h3>
                    <ul style={{ paddingRight: 20 }}>
                        <li>يمكن للمستخدمين تقييم بعضهم بعد إتمام طلب اتصال.</li>
                        <li>التقييمات يجب أن تكون صادقة وموضوعية.</li>
                        <li>التقييمات الكاذبة أو الانتقامية قد تؤدي إلى حظر الحساب.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>7. الخصوصية</h3>
                    <ul style={{ paddingRight: 20 }}>
                        <li>نحن نحترم خصوصيتك ونحمي بياناتك الشخصية.</li>
                        <li>لن تتم مشاركة رقم هاتفك إلا وفقاً لإعدادات الخصوصية التي تختارها.</li>
                        <li>يتم تخزين بيانات الموقع لأغراض البحث فقط.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>8. إخلاء المسؤولية</h3>
                    <ul style={{ paddingRight: 20 }}>
                        <li>المنصة غير مسؤولة عن جودة العمل المقدم من أي عامل.</li>
                        <li>المنصة غير مسؤولة عن أي خلاف مالي بين الأطراف.</li>
                        <li>المنصة تُقدم كما هي دون أي ضمانات.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>9. التعديلات</h3>
                    <p>يحق لنا تعديل هذه الشروط في أي وقت. سيتم إعلام المستخدمين بالتعديلات الجوهرية عبر إشعارات المنصة.</p>
                </section>

                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--gray-800)' }}>10. التواصل</h3>
                    <p>للاستفسارات أو الشكاوى، يُرجى التواصل عبر البريد الإلكتروني:</p>
                    <p style={{ fontWeight: 700, direction: 'ltr', display: 'inline-block' }}>alshraky3@gmail.com</p>
                </section>
            </div>
        </div>
    );
}
