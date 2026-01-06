import os
import httpx
import json
import socket
from typing import Dict

class EmailService:
    def __init__(self):
        # Configuration Resend API
        self.api_key = os.getenv("RESEND_API_KEY")
        self.api_url = "https://api.resend.com/emails"
        # Note: Resend impose 'onboarding@resend.dev' tant que le domaine n'est pas vérifié
        self.email_sender = os.getenv("EMAIL_SENDER", "onboarding@resend.dev")
        self.sender_name = "Administration UATM"
        
    def tester_connectivite(self) -> Dict[str, bool]:
        """Teste la connectivité vers différentes cibles pour le diagnostic"""
        tests = {
            "google_http (443)": ("google.com", 443),
            "resend_api (443)": ("api.resend.com", 443),
        }
        resultats = {}
        for nom, (host, port) in tests.items():
            try:
                print(f"🔍 Test de connexion vers {nom} ({host}:{port})...", flush=True)
                socket.create_connection((host, port), timeout=5)
                resultats[nom] = True
            except Exception:
                resultats[nom] = False
        return resultats
    
    def envoyer_email_creation_compte(self, destinataire: str, prenom: str, 
                                     email: str, mot_de_passe: str, role: str) -> bool:
        """Envoie un email via l'API Resend"""
        if not self.api_key:
            print("❌ ERREUR: RESEND_API_KEY non configurée", flush=True)
            return False

        print(f"📧 [RESEND] Préparation de l'envoi à {destinataire}...", flush=True)
        
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
            "from": f"{self.sender_name} <{self.email_sender}>",
            "to": [destinataire],
            "subject": f"Création de votre compte {role}",
            "html": corps_html
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"🚀 Appel API Resend vers <{destinataire}>...", flush=True)
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
                
            if response.status_code in [200, 201]:
                print(f"✅ Email envoyé via Resend !", flush=True)
                return True
            else:
                print(f"❌ Erreur Resend ({response.status_code}): {response.text}", flush=True)
                return False
        except Exception as e:
            print(f"❌ Erreur critique API Resend: {e}", flush=True)
            return False

    def envoyer_email_assignation_travail(self, destinataire: str, prenom: str,
                                         titre_travail: str, nom_matiere: str,
                                         formateur: str, date_echeance: str,
                                         description: str) -> bool:
        """Envoie un email d'assignation via l'API Resend"""
        if not self.api_key: return False
        
        payload = {
            "from": f"{self.sender_name} <{self.email_sender}>",
            "to": [destinataire],
            "subject": f"Nouveau travail : {titre_travail}",
            "html": f"<h3>Bonjour {prenom}</h3><p>Nouveau travail dans {nom_matiere}. Échéance: {date_echeance}</p>"
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            return response.status_code in [200, 201]
        except:
            return False

# Instance globale du service email
email_service = EmailService()
