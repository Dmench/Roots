import type { EventPreview } from '@/lib/data/events'
import type { RedditPost } from '@/lib/data/reddit'
import type { NewsItem } from '@/lib/data/news'

interface DigestData {
  cityName:    string
  cityId:      string
  firstName:   string
  dateRange:   string            // e.g. "Mon 21 – Sun 27 April"
  savedEvents: EventPreview[]    // user's saved upcoming events (up to 5)
  picks:       EventPreview[]    // curated broad-appeal picks (up to 3)
  reddit:      RedditPost[]      // top 3 city posts
  news:        NewsItem[]        // top 3 news items
  appUrl:      string
}

const SOURCE_COLOR: Record<string, string> = {
  'The Bulletin': '#4744C8',
  'Politico EU':  '#EF3340',
  'Botanique':    '#2D7D46',
  'Flagey':       '#C8900A',
  'La Monnaie':   '#B8860B',
  'Magasin 4':    '#E8001E',
  'Recyclart':    '#E84B1A',
  'Halles de Schaerbeek': '#9B4DCA',
  'Ticketmaster': '#0073E6',
}

function eventRow(ev: EventPreview, accent = '#4744C8'): string {
  const color = SOURCE_COLOR[ev.source] ?? accent
  const imgCell = ev.image
    ? `<td width="72" valign="top" style="padding-right:12px;padding-top:2px;">
        <img src="${ev.image}" width="60" height="60" alt="" style="border-radius:8px;display:block;object-fit:cover;width:60px;height:60px;" />
       </td>`
    : `<td width="72" valign="top" style="padding-right:12px;padding-top:2px;">
        <div style="width:60px;height:60px;border-radius:8px;background:${color}18;display:flex;align-items:center;justify-content:center;font-size:22px;text-align:center;line-height:60px;">&#127926;</div>
       </td>`

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        ${imgCell}
        <td valign="top">
          <p style="margin:0 0 3px;font-size:9px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:${color};">${ev.source.toUpperCase()}</p>
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1a1832;line-height:1.35;">${ev.title}</p>
          <p style="margin:0;font-size:11px;color:#888;font-weight:500;">${ev.date}${ev.time ? ' · ' + ev.time : ''}${ev.venue && ev.venue !== ev.source ? ' · ' + ev.venue : ''}</p>
        </td>
      </tr>
    </table>`
}

function sectionHeader(label: string, color = '#4744C8'): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="font-size:9px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:${color};white-space:nowrap;padding-right:12px;">${label}</td>
        <td style="border-top:1px solid #ebe8df;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>`
}

export function buildDigestEmail(data: DigestData): { html: string; subject: string } {
  const { cityName, cityId, firstName, dateRange, savedEvents, picks, reddit, news, appUrl } = data

  const subject = `Your ${cityName} week · ${dateRange}`

  const hasSaved = savedEvents.length > 0

  const savedSection = hasSaved
    ? `
      ${sectionHeader('Your saved events', '#4744C8')}
      ${savedEvents.map(ev => `
        <a href="${ev.url}" style="text-decoration:none;display:block;" target="_blank">
          ${eventRow(ev, '#4744C8')}
        </a>`).join('')}
    `
    : ''

  const picksSection = picks.length > 0
    ? `
      ${sectionHeader(hasSaved ? 'Also this week' : 'This week in ' + cityName, '#10B981')}
      ${picks.map(ev => `
        <a href="${ev.url}" style="text-decoration:none;display:block;" target="_blank">
          ${eventRow(ev, '#10B981')}
        </a>`).join('')}
    `
    : ''

  const redditSection = reddit.length > 0
    ? `
      ${sectionHeader('What ' + cityName + ' is talking about', '#FF4500')}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1A2E;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        ${reddit.map((post, i) => `
          <tr>
            <td style="padding:${i === 0 ? '14px 16px' : '0 16px 14px'};border-top:${i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none'};">
              <a href="${post.permalink}" target="_blank" style="text-decoration:none;display:block;">
                <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#F5ECD7;line-height:1.4;">${post.title}</p>
                <p style="margin:0;font-size:9px;color:rgba(245,236,215,0.35);">${post.score >= 1000 ? (post.score / 1000).toFixed(1) + 'k' : post.score} upvotes · ${post.comments} comments${post.flair ? ' · ' + post.flair : ''}</p>
              </a>
            </td>
          </tr>`).join('')}
        <tr>
          <td style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);">
            <a href="https://reddit.com/r/${cityId}" target="_blank" style="font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#FF4500;text-decoration:none;">Open r/${cityId} ↗</a>
          </td>
        </tr>
      </table>
    `
    : ''

  const newsSection = news.length > 0
    ? `
      ${sectionHeader('In brief', '#252450')}
      ${news.map(item => {
        const color = SOURCE_COLOR[item.source] ?? '#252450'
        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;border-radius:8px;overflow:hidden;border:1px solid #ebe8df;">
            <tr>
              <td width="3" style="background:${color};font-size:0;line-height:0;">&nbsp;</td>
              <td style="padding:10px 12px;">
                <a href="${item.url}" target="_blank" style="text-decoration:none;">
                  <p style="margin:0 0 2px;font-size:8px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:${color};">${item.source}</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#1a1832;line-height:1.4;">${item.title}</p>
                </a>
              </td>
            </tr>
          </table>`
      }).join('')}
    `
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F5ECD7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5ECD7">
    <tr><td align="center" style="padding:24px 16px 0;">

      <!-- Outer card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(37,36,80,0.08);">

        <!-- Color bar -->
        <tr>
          <td height="4" style="background:linear-gradient(90deg,#FF3EBA 0%,#FF3EBA 25%,#38C0F0 25%,#38C0F0 50%,#FAB400 50%,#FAB400 75%,#4744C8 75%,#4744C8 100%);font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="background:#252450;padding:32px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:10px;font-weight:900;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,236,215,0.3);">ROOTS · CITY DIGEST</p>
                  <h1 style="margin:0;font-size:42px;font-weight:900;color:#F5ECD7;line-height:1;letter-spacing:-0.02em;">${cityName}</h1>
                  <p style="margin:6px 0 0;font-size:12px;color:rgba(245,236,215,0.4);font-weight:500;">${dateRange}</p>
                </td>
                <td align="right" valign="top" style="padding-top:4px;">
                  <p style="margin:0;font-size:12px;color:rgba(245,236,215,0.35);">Hey ${firstName},</p>
                  <p style="margin:4px 0 0;font-size:11px;color:rgba(245,236,215,0.2);">here's your week</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">

            ${savedSection}
            ${picksSection}
            ${redditSection}
            ${newsSection}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}/${cityId}" target="_blank"
                    style="display:inline-block;padding:12px 28px;background:#252450;color:#F5ECD7;font-size:12px;font-weight:700;text-decoration:none;border-radius:100px;letter-spacing:0.02em;">
                    Open ${cityName} →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #f0ece3;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:10px;color:#bbb;line-height:1.5;">
                    You're receiving the ${cityName} weekly digest because you have a Roots account.<br />
                    <a href="${appUrl}/profile" style="color:#4744C8;text-decoration:none;">Manage preferences</a>
                    &nbsp;·&nbsp;
                    <a href="${appUrl}/api/digest/unsubscribe?city=${cityId}" style="color:#aaa;text-decoration:none;">Unsubscribe</a>
                  </p>
                </td>
                <td align="right" valign="top">
                  <p style="margin:0;font-size:11px;font-weight:900;color:rgba(37,36,80,0.2);letter-spacing:-0.01em;">Roots</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <p style="margin:16px 0 32px;font-size:10px;color:rgba(37,36,80,0.25);text-align:center;">
        ${cityName} · Updated weekly · <a href="${appUrl}" style="color:rgba(37,36,80,0.35);text-decoration:none;">roots.so</a>
      </p>

    </td></tr>
  </table>

</body>
</html>`

  return { html, subject }
}
