import os
import httpx
import json
import socket
from typing import Dict

class EmailService:
    def __init__(self):
        # Configuration Mailtrap Sandbox API
        self.api_token = os.getenv("MAILTRAP_TOKEN")
        self.inbox_id = os.getenv("MAILTRAP_INBOX_ID")
        self.api_url = f"https://sandbox.api.mailtrap.io/api/send/{self.inbox_id}" if self.inbox_id else ""
        self.email_sender = os.getenv("EMAIL_SENDER", "admin@uatm.bj")
        self.sender_name = "Administration UATM"
        
    def tester_connectivite(self) -> Dict[str, bool]:
        """Teste la connectivité vers Mailtrap"""
        tests = {
            "google_http (443)": ("google.com", 443),
            "mailtrap_api (443)": ("sandbox.api.mailtrap.io", 443),
        }
        resultats = {}
        for nom, (host, port) in tests.items():
            try:
                socket.create_connection((host, port), timeout=5)
                resultats[nom] = True
            except Exception:
                resultats[nom] = False
        return resultats
    
    def envoyer_email_creation_compte(self, destinataire: str, prenom: str, 
                                     email: str, mot_de_passe: str, role: str) -> bool:
        """Envoie un email via l'API Mailtrap Sandbox"""
        if not self.api_token or not self.inbox_id:
            print("❌ ERREUR: MAILTRAP_TOKEN ou MAILTRAP_INBOX_ID non configurée", flush=True)
            return False

        print(f"📧 [MAILTRAP] Capture de l'envoi pour {destinataire}...", flush=True)
        
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
            <p><i>Note : Ceci est un email de test Mailtrap.</i></p>
            <br>
            <p>Cordialement,<br>L'équipe administrative</p>
        </body>
        </html>
        """
        
        payload = {
            "from": {"email": self.email_sender, "name": self.sender_name},
            "to": [{"email": destinataire}],
            "subject": f"Création de votre compte {role}",
            "html": corps_html
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"🚀 Appel API Mailtrap Sandbox vers <{destinataire}>...", flush=True)
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
                
            if response.status_code in [200, 201]:
                print(f"✅ Email capturé par Mailtrap !", flush=True)
                return True
            else:
                print(f"❌ Erreur Mailtrap ({response.status_code}): {response.text}", flush=True)
                return False
        except Exception as e:
            print(f"❌ Erreur critique API Mailtrap: {e}", flush=True)
            return False

    def envoyer_email_assignation_travail(self, destinataire: str, prenom: str,
                                         titre_travail: str, nom_matiere: str,
                                         formateur: str, date_echeance: str,
                                         description: str) -> bool:
        """Envoie un email d'assignation via l'API Mailtrap"""
        if not self.api_token or not self.inbox_id: return False
        
        payload = {
            "from": {"email": self.email_sender, "name": self.sender_name},
            "to": [{"email": destinataire}],
            "subject": f"Nouveau travail : {titre_travail}",
            "html": f"<h3>Bonjour {prenom}</h3><p>Nouveau travail dans {nom_matiere}. Échéance: {date_echeance}</p>"
        }
        headers = {"Authorization": f"Bearer {self.api_token}", "Content-Type": "application/json"}
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            return response.status_code in [200, 201]
        except:
            return False

# Instance globale du service email
email_service = EmailService()

# Instance globale du service email
email_service = EmailService()
