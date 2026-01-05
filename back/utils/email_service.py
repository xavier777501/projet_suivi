import os
import httpx
import json
from typing import Dict

class EmailService:
    def __init__(self):
        # Configuration Brevo API (La clé doit être dans BREVO_API_KEY sur Render)
        self.api_key = os.getenv("BREVO_API_KEY")
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.email_sender = os.getenv("EMAIL_SENDER", "tfxyesu@gmail.com")
        self.sender_name = "Administration UATM"
        
    def tester_connectivite(self) -> Dict[str, bool]:
        """Teste la connectivité vers différentes cibles pour le diagnostic"""
        tests = {
            "google_http (443)": ("google.com", 443),
            "gmail_smtp_ssl (465)": ("smtp.gmail.com", 465),
            "gmail_smtp_tls (587)": ("smtp.gmail.com", 587),
        }
        resultats = {}
        for nom, (host, port) in tests.items():
            try:
                print(f"🔍 Test de connexion vers {nom} ({host}:{port})...", flush=True)
                socket.create_connection((host, port), timeout=5)
                resultats[nom] = True
                print(f"✅ {nom} est joignable !", flush=True)
            except Exception as e:
                resultats[nom] = False
                print(f"❌ {nom} INJOIGNABLE : {e}", flush=True)
        return resultats
    
    def envoyer_email_creation_compte(self, destinataire: str, prenom: str, 
                                     email: str, mot_de_passe: str, role: str) -> bool:
        """Envoie un email via l'API Brevo"""
        if not self.api_key:
            print("❌ ERREUR: BREVO_API_KEY non configurée", flush=True)
            return False

        print(f"📧 [BREVO] Préparation de l'envoi à {destinataire}...", flush=True)
        
        corps_html = f"""
        <html>
        <body>
            <h3>Bonjour {prenom},</h3>
            <p>Votre compte <b>{role.lower()}</b> a été créé avec succès.</p>
            <p>Voici vos identifiants de connexion :</p>
            <ul>
                <li><b>Email :</b> {email}</li>
                <li><b>Mot de passe :</b> {mot_de_passe}</li>
            </ul>
            <p><i>Note : Vous devrez changer votre mot de passe lors de votre première connexion.</i></p>
            <br>
            <p>Cordialement,<br>L'équipe administrative</p>
        </body>
        </html>
        """
        
        payload = {
            "sender": {"name": self.sender_name, "email": self.email_sender},
            "to": [{"email": destinataire, "name": prenom}],
            "subject": f"Création de votre compte {role}",
            "htmlContent": corps_html
        }
        
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        try:
            print(f"🚀 Appel API Brevo pour {destinataire}...", flush=True)
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
                
            if response.status_code in [201, 200, 202]:
                print(f"✅ Email envoyé via Brevo ! ID: {response.json().get('messageId')}", flush=True)
                return True
            else:
                print(f"❌ Erreur Brevo (Status {response.status_code}): {response.text}", flush=True)
                return False
        except Exception as e:
            print(f"❌ Erreur critique API Brevo: {e}", flush=True)
            return False

    def envoyer_email_assignation_travail(self, destinataire: str, prenom: str,
                                         titre_travail: str, nom_matiere: str,
                                         formateur: str, date_echeance: str,
                                         description: str) -> bool:
        """Envoie un email d'assignation via l'API Brevo"""
        if not self.api_key: return False
        
        payload = {
            "sender": {"name": self.sender_name, "email": self.email_sender},
            "to": [{"email": destinataire, "name": prenom}],
            "subject": f"Nouveau travail : {titre_travail}",
            "htmlContent": f"<h3>Bonjour {prenom}</h3><p>Nouveau travail dans {nom_matiere}. Échéance: {date_echeance}</p>"
        }
        headers = {"api-key": self.api_key, "Content-Type": "application/json"}
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            return response.status_code in [201, 200, 202]
        except:
            return False

# Instance globale du service email
email_service = EmailService()
