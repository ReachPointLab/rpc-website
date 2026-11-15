---
title: Privacy Notice
link: Privacy
order: 1
updated: November 13, 2026
summary: What reachpointcapital.com and tranche_ collect about visitors, why, and who handles it.
---

This notice explains what information Reach Point Capital LLC ("Reach Point Capital", "we"), of Westport, Connecticut, collects when you visit reachpointcapital.com, including the newsroom and the tranche_ tool at reachpointcapital.com/tranche/, how we use it, and who else handles it. It is written in plain English on purpose, for visitors in the United States. It does not cover other sites we link to, including Reach Point Lab and Meridian; check what each of those says.

## The short version

- **Using tranche_ without an account changes nothing.** You do not need to sign in to use any part of tranche_. If you do not sign in, we create no account for you and tranche_ sets no cookie.
- **Signing in is optional, and only with Google.** If you sign in, we keep your Google account id, your email address and your name, plus a few things about your use of tranche_ while you are signed in (listed under "Accounts" below), and tranche_ sets a cookie to keep you signed in.
- **You are in control of your account.** You can sign out, download everything we hold about your account, and delete it, all in tranche_.
- Our servers and our hosting providers keep ordinary request records, including your IP address.
- We do not run advertising trackers and we do not sell personal information.

## The website (everything except tranche_)

**What we collect**

- **Site usage.** We use Vercel Web Analytics to see how the site is used: pages visited, referring site, approximate location (country), and device and browser type.
- **Messages you send us.** If you email info@reachpointcapital.com we receive your email address and whatever you choose to include. The site has no sign-up or contact forms.
- **Hosting logs.** Our hosting provider, Vercel Inc., keeps standard request logs (such as IP address, time and the page requested) for security and operations.
- **Fonts.** Page fonts are loaded from Google Fonts, so your browser contacts Google when a page loads.

**Why we use it**

- To run, secure and improve the site.
- To reply to messages you send us.
- To meet legal obligations and to protect our rights.

## tranche_

tranche_ is a tool that shows the capital structure of public companies (their debt, equity and other claims) extracted from filings with the U.S. Securities and Exchange Commission. You can use all of it without signing in and without giving us any personal information. This section covers both ways of using it: without an account, and signed in.

**What the tranche_ server records**

For every request to tranche_'s data service, and for every request that fails, the server writes one line to a log file containing:

- the time of the request,
- your IP address,
- the method (for example GET),
- the path requested,
- the response status (for example 200 or 404), and
- how long the response took.

This is the same whether or not you are signed in. The log does not contain query strings (the part of an address after a question mark), request headers, cookies or request bodies, so it does not record your browser type, language, referring page, anything you type into a search box, or, when you sign in, your email address, the sign-in code or your session id. Successful loads of ordinary page files such as scripts, styles and images are not logged. Because the path is recorded, a log line can show which company or filing you asked about.

**How we use it**

We use the log to keep the service running and to investigate faults and abuse. We also use your IP address for rate limits: it lets us count requests per visitor, so that one visitor cannot overload the service, and a visitor who sends too many requests is slowed down. Separately, visitors can ask tranche_ to process a new company, up to a daily limit that is shared by all visitors; requests over the limit wait for the next day. That daily limit does not depend on who you are.

When you ask tranche_ to process a new company, the job record in our queue also notes who asked: your IP address if you are not signed in, or a random internal account number if you are. We do not currently delete job records automatically.

**Accounts (optional sign-in with Google)**

You can sign in with your Google account. We use Google's standard sign-in (OpenID Connect) and ask Google only for your account id, your email address and your name. Signing in unlocks nothing: everything in tranche_ works the same without it. An account gives you a place to keep your lists, a record of the companies you have asked for, and a slightly earlier place in the queue than visitors who are not signed in (the daily limit stays shared).

If you sign in, we store:

- **Your account:** your Google account id, your email address, your name, and when the account was created and last used. We do not store your profile picture, and we keep no Google access tokens.
- **Your sessions:** a record for each browser you are signed in on, holding a scrambled (hashed) form of its session id, when it was created and last used, and when it expires. A session ends 30 days after you last use it, and an account can have at most 10 sessions at a time (signing in an eleventh time ends the oldest). Signing out ends the session straight away.
- **The companies you asked for:** the company symbol, the form (10-K or 10-Q) and the time of the request.
- **Your saved lists:** your watchlist and named lists of companies, up to 32 KB.

We use this to keep you signed in, to show you your own lists and requests, and to count your requests against your account rather than your IP address, so that signing in on a second device does not give you a second allowance. We do not use it for advertising or analytics, and we do not sell it. The job record for a company you asked for carries only the random internal account number; once you delete your account, that number no longer points to anyone. The capital structures tranche_ saves are public SEC data and are not part of your account.

**Cookies**

- **Without an account, tranche_ sets no cookies.**
- **While you sign in,** tranche_ sets a short-lived cookie called `tranche_signin`. It holds random values that let us check the sign-in came back to the same browser, and it lasts 10 minutes.
- **After you sign in,** tranche_ sets a cookie called `tranche_session`. It holds a random session id, is sent only to tranche_ (reachpointcapital.com/tranche), is marked HttpOnly (page scripts cannot read it), Secure (sent over https only) and SameSite=Lax, and lasts up to 30 days. It is removed when you sign out or delete your account.
- These two cookies exist only to sign you in. tranche_ sets no tracking or advertising cookies.

**Your browser**

tranche_ saves a few things in your browser's local storage so the page remembers them next time: your watchlist and saved company lists, the company you last looked at, chart and comparison choices, edits you make to a company's peer list, your screen layout and your paper-size choice for printing. This stays on your device and is not sent to us, unless you are signed in and choose to keep your lists in your account, in which case your lists are also stored there as described above. You can clear local storage at any time in your browser's settings, and tranche_ still works without it. tranche_ pages do not load advertising, analytics or other third-party scripts, and they carry their own fonts. Requests to reachpointcapital.com/tranche/ still pass through Vercel, which keeps its own records as described below.

**Who handles tranche_ requests**

- **Vercel Inc.** hosts reachpointcapital.com and receives every request to reachpointcapital.com/tranche/. It passes those requests on to the tranche_ server and may keep its own logs.
- **Tailscale** carries the requests from Vercel to the computer that runs tranche_, and keeps its own records under its own policy.
- **Google** handles the sign-in itself. When you choose to sign in, your browser goes to Google's sign-in page, and Google tells us your account id, email address and name. Google handles your information under [Google's privacy policy](https://policies.google.com/privacy). We do not send Google anything about which companies you look at.
- **The tranche_ server** is a computer operated by us.

## Who else we share information with

Service providers that host and operate the sites: Vercel Inc. (hosting and analytics), Tailscale (the connection that carries tranche_ requests) and Google (fonts, and the sign-in if you use it). We may also share information where the law requires it or to protect our rights. We do not sell it.

## Where it is processed

We process the information we hold in the United States. Our service providers run their own networks and may handle requests in other places too.

## How long we keep it

- **tranche_ request log.** Log lines are deleted automatically after 30 days.
- **tranche_ job records.** The note of who asked (your IP address, or a random internal account number) stays with the job record, and we do not currently delete job records automatically.
- **Your account, requests and lists.** We keep them until you delete your account.
- **Your sessions.** A session ends 30 days after you last use it, and sooner if you sign out or delete your account.
- **Email correspondence.** We keep it as long as needed to deal with your message.
- **Website analytics and hosting logs.** These are held by Vercel and kept for as long as Vercel's own retention rules say. See [Vercel's privacy policy](https://vercel.com/legal/privacy-policy).
- **Other providers.** Tailscale and Google keep their own records under their own policies: [Tailscale's privacy policy](https://tailscale.com/privacy-policy) and [Google's privacy policy](https://policies.google.com/privacy).

## Your choices and rights

If you have a tranche_ account, you can do these yourself in tranche_:

- **Sign out.** This ends the session on that browser.
- **Download your data.** You can download everything we hold about your account as one file (JSON): your account details, your sessions (without their ids), the companies you asked for and your saved lists.
- **Delete your account.** This removes your account, your sessions, your request history and your saved lists straight away. The saved company results stay, because they are public SEC data and are not tied to you.

For anything else, you can ask us what we hold about you, ask us to correct it, or ask us to delete it, by emailing [info@reachpointcapital.com](mailto:info@reachpointcapital.com). We will answer within 30 days. The tranche_ log has no names or accounts, so to find your lines we will need the IP address you used and roughly when you visited, and we may not be able to identify lines that are not yours. Information held by Vercel, Tailscale or Google is handled by them under their own policies.

## Children

These sites are not directed to children under 13, and we do not knowingly collect information from children under 13. If you think a child has sent us information, email us and we will delete it.

## Changes to this notice

We will post changes on this page and update the date above.

## Contact

Reach Point Capital LLC, Westport, CT. Email: [info@reachpointcapital.com](mailto:info@reachpointcapital.com).
