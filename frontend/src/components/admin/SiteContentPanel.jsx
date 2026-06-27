import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext'
import { getDefaultSiteContent } from '../../data/siteContentDefaults'
import { saveSiteContent } from '../../services/siteContentService'

function SiteContentPanel({ adminId, onError }) {
  const { content } = useSiteContent()
  const [form, setForm] = useState(getDefaultSiteContent())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(content)
  }, [content])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setServiceField = (serviceId, key, value) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((service) =>
        service.id === serviceId ? { ...service, [key]: value } : service,
      ),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!adminId) return

    setSaving(true)
    try {
      await saveSiteContent(form, adminId)
    } catch (err) {
      onError(err.message || 'საიტის შენახვა ვერ მოხერხდა.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-section admin-site-form" onSubmit={handleSubmit}>
      <div className="admin-section__head">
        <div>
          <h2>საიტის კონტენტი</h2>
          <p>შეცვალე მთავარი გვერდის ტექსტები, კონტაქტი და სერვისები.</p>
        </div>
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
          <Save size={16} />
          {saving ? 'ინახება...' : 'შენახვა'}
        </button>
      </div>

      <section className="admin-site-form__block">
        <h3>მთავარი გვერდი</h3>
        <label className="admin-site-form__field">
          <span>ზედა ხაზი</span>
          <input
            value={form.heroEyebrow}
            onChange={(e) => setField('heroEyebrow', e.target.value)}
          />
        </label>
        <label className="admin-site-form__field">
          <span>სათაური</span>
          <input value={form.heroTitle} onChange={(e) => setField('heroTitle', e.target.value)} />
        </label>
        <label className="admin-site-form__field">
          <span>აქცენტი</span>
          <input
            value={form.heroTitleAccent}
            onChange={(e) => setField('heroTitleAccent', e.target.value)}
          />
        </label>
        <label className="admin-site-form__field">
          <span>ქვესათაური</span>
          <textarea
            rows={3}
            value={form.heroSubtitle}
            onChange={(e) => setField('heroSubtitle', e.target.value)}
          />
        </label>
        <label className="admin-site-form__field">
          <span>ტაგლაინი</span>
          <input value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} />
        </label>
        <label className="admin-site-form__field">
          <span>აღწერა (SEO)</span>
          <textarea
            rows={2}
            value={form.siteDescription}
            onChange={(e) => setField('siteDescription', e.target.value)}
          />
        </label>
      </section>

      <section className="admin-site-form__block">
        <h3>კონტაქტი</h3>
        <label className="admin-site-form__field">
          <span>ტელეფონი</span>
          <input
            value={form.contactPhone}
            onChange={(e) => setField('contactPhone', e.target.value)}
          />
        </label>
        <label className="admin-site-form__field">
          <span>ელ. ფოსტა</span>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setField('contactEmail', e.target.value)}
          />
        </label>
        <label className="admin-site-form__field">
          <span>სამუშაო საათები</span>
          <input
            value={form.workingHours}
            onChange={(e) => setField('workingHours', e.target.value)}
          />
        </label>
      </section>

      <section className="admin-site-form__block">
        <h3>ჩვენ შესახებ</h3>
        <label className="admin-site-form__field">
          <span>შესავალი ტექსტი</span>
          <textarea
            rows={4}
            value={form.aboutIntro}
            onChange={(e) => setField('aboutIntro', e.target.value)}
          />
        </label>
      </section>

      <section className="admin-site-form__block">
        <h3>სერვისები</h3>
        <div className="admin-site-form__services">
          {form.services.map((service) => (
            <article key={service.id} className="admin-site-form__service">
              <label className="admin-site-form__checkbox">
                <input
                  type="checkbox"
                  checked={service.enabled !== false}
                  onChange={(e) => setServiceField(service.id, 'enabled', e.target.checked)}
                />
                <span>{service.title}</span>
              </label>
              <label className="admin-site-form__field">
                <span>სათაური</span>
                <input
                  value={service.title}
                  onChange={(e) => setServiceField(service.id, 'title', e.target.value)}
                />
              </label>
              <label className="admin-site-form__field">
                <span>აღწერა</span>
                <textarea
                  rows={2}
                  value={service.description}
                  onChange={(e) => setServiceField(service.id, 'description', e.target.value)}
                />
              </label>
            </article>
          ))}
        </div>
      </section>
    </form>
  )
}

export default SiteContentPanel
