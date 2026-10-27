import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('campaign', Path(__file__).parents[1]/'scripts/marketing-campaign.py')
campaign = importlib.util.module_from_spec(spec)
spec.loader.exec_module(campaign)


class CampaignTests(unittest.TestCase):
    def setUp(self):
        self.contact = {'id': 'contact-1', 'email': 'test@example.com',
                        'unsubscribeUrl': 'https://utekos.no/api/email/marketing/unsubscribe?token=m1.test'}
        self.content = {'from': 'approved@example.com', 'subject': 'Test',
                        'html': '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Meld meg av</a>',
                        'text': 'Meld meg av {{{RESEND_UNSUBSCRIBE_URL}}}'}

    def test_personal_url_matches_both_headers_and_bodies(self):
        payload = campaign.payload_for(self.content, self.contact)
        self.assertEqual(payload['to'], ['test@example.com'])
        self.assertEqual(payload['headers']['List-Unsubscribe'], '<'+self.contact['unsubscribeUrl']+'>')
        self.assertEqual(payload['headers']['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
        self.assertNotIn('{{{', payload['html']+payload['text'])

    def test_opt_out_blocks_delivery(self):
        self.assertFalse(campaign.eligible(self.contact, {**self.contact, 'unsubscribed': True}))
        self.assertTrue(campaign.eligible(self.contact, {**self.contact, 'unsubscribed': False}))

    def test_missing_subscription_and_identity_changes_fail_closed(self):
        for fresh in [self.contact, {**self.contact, 'unsubscribed': 'false'},
                      {**self.contact, 'email': 'other@example.com', 'unsubscribed': False}]:
            with self.assertRaises(ValueError):
                campaign.eligible(self.contact, fresh)

    def test_missing_or_unresolved_placeholders_abort(self):
        for content in [{**self.content, 'html': 'No link'},
                        {**self.content, 'text': self.content['text']+'{{{FIRST_NAME}}}'}]:
            with self.assertRaises(ValueError):
                campaign.payload_for(content, self.contact)


if __name__ == '__main__':
    unittest.main()
