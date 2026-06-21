import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryPaymentGateway, Marketplace, MarketplaceError } from './domain.js';

const setup = () => {
  const payments = new InMemoryPaymentGateway();
  const app = new Marketplace(payments);
  const admin = app.createAdmin('admin@example.com');
  const client = app.register('client@example.com', 'correct horse battery', 'client');
  const pro = app.register('pro@example.com', 'correct horse battery', 'professional');
  app.verifyEmail(client.id);
  app.verifyEmail(pro.id);
  app.upsertProfessionalProfile(pro.id, {
    name: 'Asha Rao', headline: 'Chartered Accountant for tax and audit', bio: 'Ten years helping SMEs with audit and tax.',
    certifications: [{ type: 'CA', licenseNumber: 'CA-12345', documentKey: 'certs/ca-12345.pdf' }],
    yearsExperience: 10, specializations: ['Tax', 'Audit'], hourlyRate: 120, languages: ['en', 'hi']
  });
  app.reviewVerification(admin.id, pro.id, true);
  return { app, payments, admin, client, pro };
};

test('auth prevents duplicate sign-ups and authenticates hashed passwords', () => {
  const { app, client } = setup();
  assert.equal(app.authenticate('client@example.com', 'correct horse battery').id, client.id);
  assert.throws(() => app.register('client@example.com', 'another long password', 'client'), (error: MarketplaceError) => error.code === 'DUPLICATE_SIGNUP');
  assert.throws(() => app.authenticate('client@example.com', 'wrong password'), (error: MarketplaceError) => error.code === 'INVALID_CREDENTIALS');
});

test('verification approval gates public listings and bidding', () => {
  const { app, pro } = setup();
  const listing = app.createListing(pro.id, { title: 'GST filing', description: 'End-to-end GST filing', category: 'Tax', tags: ['gst', 'tax'], fixedPrice: 150 });
  assert.equal(app.searchListings('gst', { certification: 'CA', maxPrice: 200, language: 'en' })[0]?.id, listing.id);
});

test('proposal acceptance is single-winner and creates a funded releasable contract', async () => {
  const { app, payments, client, pro } = setup();
  const job = app.postJob(client.id, { title: 'Audit support', description: 'Need audit workpapers reviewed', category: 'Audit', tags: ['audit'], budget: 2000, deadline: new Date(Date.now() + 86_400_000), requiredCertification: 'CA' });
  const proposal = app.submitProposal(pro.id, job.id, { price: 1800, timelineDays: 14, coverNote: 'I can complete this with a checklist and review memo.' });
  const contract = app.acceptProposal(client.id, proposal.id);
  assert.equal(contract.status, 'active');
  assert.throws(() => app.acceptProposal(client.id, proposal.id), (error: MarketplaceError) => error.code === 'PROPOSAL_RACE_LOST');
  const milestone = contract.milestones[0];
  if (!milestone) throw new Error('missing milestone');
  await app.fundMilestone(client.id, contract.id, milestone.id);
  assert.equal(milestone.status, 'funded');
  await app.releaseMilestone(client.id, contract.id, milestone.id);
  assert.equal(contract.status, 'completed');
  assert.equal(payments.holds.get(milestone.paymentIntentId ?? '')?.state, 'released');
});

test('reviews update professional aggregate rating after completion', async () => {
  const { app, client, pro } = setup();
  const job = app.postJob(client.id, { title: 'Tax planning', description: 'Annual tax plan', category: 'Tax', tags: ['tax'], budget: 900, deadline: new Date(Date.now() + 86_400_000) });
  const proposal = app.submitProposal(pro.id, job.id, { price: 800, timelineDays: 5, coverNote: 'Detailed tax planning report.' });
  const contract = app.acceptProposal(client.id, proposal.id);
  const milestone = contract.milestones[0];
  if (!milestone) throw new Error('missing milestone');
  await app.fundMilestone(client.id, contract.id, milestone.id);
  await app.releaseMilestone(client.id, contract.id, milestone.id);
  app.addReview(contract.id, client.id, 5, 'Excellent work');
  assert.equal(app.profiles.get(pro.id)?.rating, 5);
  assert.equal(app.profiles.get(pro.id)?.reviewCount, 1);
});
