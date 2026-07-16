# 🌐 Domain Setup Guide — Sanchos Real Estate CRM

## Step 1 — Buy your domain

### Best option: Namecheap.com
1. Go to **namecheap.com**
2. Search for: `sanchosrealestate.com` or `sanchoscrm.com`
3. Price: ~$10-15/year
4. Create account → Add to cart → Checkout → Pay

### Other options:
- **GoDaddy.com** — popular, slightly more expensive
- **Cloudflare Registrar** — cheapest ($8-9/year, no markup)

### Recommended domain names (check availability):
- `crm.sanchosrealestate.com` (subdomain — if you own the main domain)
- `sanchoscrm.com`
- `sanchos-crm.com`
- `sanchosrealestate.net`

---

## Step 2 — Deploy to Vercel (free hosting)

1. Create account at **vercel.com** (free, sign in with GitHub)
2. Push your code to GitHub:
   ```bash
   cd sanchos-crm
   git init
   git add .
   git commit -m "Initial commit"
   # Create repo on github.com first, then:
   git remote add origin https://github.com/YOURNAME/sanchos-crm.git
   git push -u origin main
   ```
3. In Vercel: **New Project** → Import from GitHub → Select `sanchos-crm`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `NOTIFICATION_PROVIDER` = `africastalking` (or `mock` for testing)
   - `AT_API_KEY` = your Africa's Talking key
   - `AT_USERNAME` = your Africa's Talking username
5. Click **Deploy** — you get a free URL like `sanchos-crm-xyz.vercel.app`

---

## Step 3 — Connect your custom domain

### In Vercel:
1. Go to your project → **Settings** → **Domains**
2. Type your domain (e.g. `sanchosrealestate.com`)
3. Click **Add**
4. Vercel shows you two DNS records to add

### In Namecheap:
1. Go to **Namecheap** → **Domain List** → click **Manage** next to your domain
2. Click **Advanced DNS**
3. Delete any existing A records and CNAME records for `@` and `www`
4. Add the records Vercel gave you:
   - **Type:** A Record | **Host:** @ | **Value:** 76.76.21.21
   - **Type:** CNAME   | **Host:** www | **Value:** cname.vercel-dns.com
5. Wait 5-30 minutes for DNS to propagate

✅ Your app is now live at `https://sanchosrealestate.com`

---

## Step 4 — Set up SMS notifications (Africa's Talking)

### Best for Ethiopian phone numbers (Ethio Telecom, Safaricom):

1. Go to **africastalking.com** → Create account
2. In your dashboard → **API Key** → copy it
3. Add to Vercel env vars:
   - `NOTIFICATION_PROVIDER=africastalking`
   - `AT_API_KEY=your_key_here`
   - `AT_USERNAME=your_username`
   - `AT_SENDER_ID=SANCHOS`
4. Top up your account (starts from $5)
5. Cost: ~0.01-0.03 USD per SMS in Ethiopia

### For WhatsApp notifications (Twilio):
1. Go to **twilio.com** → Create account → Get $15 free credit
2. Get a WhatsApp sandbox number for testing
3. Add env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`

---

## Step 5 — Disable email confirmation (for easy agent signup)

In **Supabase Dashboard**:
1. Go to **Authentication** → **Providers** → **Email**
2. Toggle OFF **"Confirm email"**
3. Now agents can sign up and log in immediately

---

## Full Cost Summary (6-20 agents)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free (up to 500MB, 50k users) | $0/month |
| Vercel | Pro (for team + custom domain) | $20/month |
| Domain | Namecheap .com | ~$12/year |
| Africa's Talking SMS | Pay per SMS | ~$0.02/SMS |
| **Total** | | **~$21/month** |

> **Start free!** Use Vercel Hobby + Supabase Free for the first few months.
> Only upgrade Vercel to Pro when you need team features or more bandwidth.

