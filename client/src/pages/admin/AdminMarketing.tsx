import { FormEvent, useEffect, useState } from 'react';
import { ImagePlus, Megaphone, Save, Share2 } from 'lucide-react';
import { api } from '../../api/client';

type MarketingValues = Record<string, string>;

export default function AdminMarketing() {
  const [values, setValues] = useState<MarketingValues>({
    social_facebook: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
    seo_default_title: '',
    seo_default_description: '',
    home_announcement_enabled: 'false',
    home_announcement_label: 'New',
    home_announcement_text: '',
    home_announcement_link: '',
  });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignPreview, setCampaignPreview] = useState('');

  useEffect(() => {
    api<Record<string, unknown>>('/settings/public')
      .then(result => setValues(current => ({
        ...current,
        ...Object.fromEntries(Object.entries(result.data ?? {}).map(([key, value]) => [key, String(value ?? '')])),
      })))
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load marketing settings.'));
  }, []);

  useEffect(() => () => {
    if (campaignPreview) URL.revokeObjectURL(campaignPreview);
  }, [campaignPreview]);

  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      let campaignUrl = values.home_announcement_media_url ?? '';
      if (campaignFile) {
        const form = new FormData();
        form.append('file', campaignFile);
        form.append('folder', 'campaigns');
        const upload = await api<{ url: string }>('/admin/media/upload', {
          method: 'POST',
          body: form,
          headers: {},
        });
        campaignUrl = upload.data.url;
      }
      const result = await api('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ ...values, home_announcement_media_url: campaignUrl }),
      });
      setNotice(result.message ?? 'Marketing campaign published.');
      window.dispatchEvent(new Event('natgas-settings-change'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to publish marketing changes.');
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Social &amp; marketing</h1>
          <p className="admin-page-sub">Manage social channels, search visibility and homepage campaigns.</p>
        </div>
      </div>
      {notice && <p className="form-ok">{notice}</p>}
      {error && <p className="form-err">{error}</p>}
      <form className="admin-form" onSubmit={save}>
        <section className="admin-card admin-card-body">
          <h2><Share2 size={16} /> Social channels</h2>
          <div className="form-grid">
            <label>Facebook<input type="url" value={values.social_facebook} onChange={event => set('social_facebook', event.target.value)} placeholder="https://facebook.com/..." /></label>
            <label>X / Twitter<input type="url" value={values.social_twitter} onChange={event => set('social_twitter', event.target.value)} placeholder="https://x.com/..." /></label>
            <label>LinkedIn<input type="url" value={values.social_linkedin} onChange={event => set('social_linkedin', event.target.value)} placeholder="https://linkedin.com/company/..." /></label>
            <label>YouTube<input type="url" value={values.social_youtube} onChange={event => set('social_youtube', event.target.value)} placeholder="https://youtube.com/..." /></label>
          </div>
        </section>
        <section className="admin-card admin-card-body">
          <h2><Megaphone size={16} /> Homepage campaign</h2>
          <div className="form-grid">
            <label>Status<select value={values.home_announcement_enabled} onChange={event => set('home_announcement_enabled', event.target.value)}><option value="false">Hidden</option><option value="true">Active</option></select></label>
            <label>Campaign label<input value={values.home_announcement_label} onChange={event => set('home_announcement_label', event.target.value)} /></label>
            <label>Campaign message<input value={values.home_announcement_text} onChange={event => set('home_announcement_text', event.target.value)} /></label>
            <label>Action link<input value={values.home_announcement_link} onChange={event => set('home_announcement_link', event.target.value)} placeholder="/products or https://..." /></label>
            <label>Campaign image<input type="file" accept="image/*" onChange={event => {
              const file = event.target.files?.[0] ?? null;
              setCampaignFile(file);
              if (campaignPreview) URL.revokeObjectURL(campaignPreview);
              setCampaignPreview(file ? URL.createObjectURL(file) : '');
            }} /></label>
          </div>
          {(campaignPreview || values.home_announcement_media_url) && (
            <img className="marketing-campaign-preview" src={campaignPreview || values.home_announcement_media_url} alt="Campaign preview" />
          )}
        </section>
        <section className="admin-card admin-card-body">
          <h2>Search visibility</h2>
          <div className="form-grid">
            <label>SEO title<input value={values.seo_default_title} onChange={event => set('seo_default_title', event.target.value)} /></label>
            <label>SEO description<textarea rows={3} value={values.seo_default_description} onChange={event => set('seo_default_description', event.target.value)} /></label>
          </div>
        </section>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary"><Save size={15} /> Publish marketing</button>
        </div>
      </form>
    </div>
  );
}
