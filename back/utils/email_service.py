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
        if not self.api_token or not self.inbox_id:
            print("❌ ERREUR: MAILTRAP_TOKEN ou MAILTRAP_INBOX_ID non configurée", flush=True)
            return False

        print(f"📧 [MAILTRAP] Notification d'assignation pour {destinataire}...", flush=True)
        
        corps_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #2563eb;">Nouveau travail assigné !</h2>
                <p>Bonjour <strong>{prenom}</strong>,</p>
                <p>Un nouveau travail vous a été assigné dans la matière <strong>{nom_matiere}</strong> par votre formateur <strong>{formateur}</strong>.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin-top: 0;"><strong>Titre :</strong> {titre_travail}</p>
                    <p><strong>Échéance :</strong> <span style="color: #dc2626; font-weight: bold;">{date_echeance}</span></p>
                    <p style="margin-bottom: 0;"><strong>Description :</strong><br>{description}</p>
                </div>
                
                <p>Pour toute question, n'hésitez pas à contacter votre formateur.</p>
                <br>
                <p>Cordialement,<br>L'équipe pédagogique</p>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "from": {"email": self.email_sender, "name": self.sender_name},
            "to": [{"email": destinataire}],
            "subject": f"Nouveau travail : {titre_travail} - {nom_matiere}",
            "html": corps_html
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            return response.status_code in [200, 201]
        except Exception as e:
            print(f"❌ Erreur critique API Mailtrap: {e}", flush=True)
            return False

    def envoyer_email_livraison_travail(self, destinataire: str, prenom_formateur: str,
                                      nom_etudiant: str, prenom_etudiant: str,
                                      titre_travail: str, nom_matiere: str) -> bool:
        """Envoie un email de notification de livraison au formateur"""
        if not self.api_token or not self.inbox_id:
            return False

        corps_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #059669;">Nouvelle livraison reçue !</h2>
                <p>Bonjour <strong>{prenom_formateur}</strong>,</p>
                <p>L'étudiant <strong>{prenom_etudiant} {nom_etudiant}</strong> vient de soumettre son travail pour le sujet :</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Titre :</strong> {titre_travail}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Matière :</strong> {nom_matiere}</p>
                </div>
                <p>Vous pouvez maintenant consulter et noter cette livraison depuis votre espace pédagogique.</p>
                <br>
                <p>Cordialement,<br>Le système de suivi pédagogique</p>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "from": {"email": self.email_sender, "name": self.sender_name},
            "to": [{"email": destinataire}],
            "subject": f"Livraison reçue : {prenom_etudiant} {nom_etudiant} - {titre_travail}",
            "html": corps_html
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            return response.status_code in [200, 201]
        except Exception as e:
            print(f"❌ Erreur critique API Mailtrap: {e}", flush=True)
            return False

    def envoyer_email_soumission_travail(self, destinataire: str, prenom_formateur: str,
                                        prenom_etudiant: str, nom_etudiant: str,
                                        titre_travail: str, nom_matiere: str,
                                        date_soumission: str, commentaire: str) -> bool:
        """Envoie un email de notification de soumission de travail au formateur"""
        if not self.api_token or not self.inbox_id:
            print("❌ ERREUR: MAILTRAP_TOKEN ou MAILTRAP_INBOX_ID non configurée", flush=True)
            return False

        print(f"📧 [MAILTRAP] Notification de soumission pour {destinataire}...", flush=True)
        
        corps_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #16a34a;">📝 Nouveau travail rendu !</h2>
                <p>Bonjour <strong>{prenom_formateur}</strong>,</p>
                <p>L'étudiant <strong>{prenom_etudiant} {nom_etudiant}</strong> vient de rendre son travail dans la matière <strong>{nom_matiere}</strong>.</p>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #16a34a;">
                    <p style="margin-top: 0;"><strong>Travail :</strong> {titre_travail}</p>
                    <p><strong>Date de soumission :</strong> {date_soumission}</p>
                    <p style="margin-bottom: 0;"><strong>Commentaire de l'étudiant :</strong><br><em>{commentaire}</em></p>
                </div>
                
                <p>Connectez-vous à votre espace formateur pour consulter le travail et l'évaluer.</p>
                <br>
                <p>Cordialement,<br>L'équipe pédagogique UATM</p>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "from": {"email": self.email_sender, "name": self.sender_name},
            "to": [{"email": destinataire}],
            "subject": f"📝 Travail rendu : {titre_travail} - {prenom_etudiant} {nom_etudiant}",
            "html": corps_html
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                print(f"✅ Email de soumission capturé par Mailtrap !", flush=True)
                return True
            else:
                print(f"❌ Erreur Mailtrap ({response.status_code}): {response.text}", flush=True)
                return False
        except Exception as e:
            print(f"❌ Erreur critique API Mailtrap: {e}", flush=True)
            return False

    def envoyer_email_evaluation_travail(self, destinataire: str, prenom_etudiant: str,
                                        titre_travail: str, nom_matiere: str,
                                        note: float, note_max: float,
                                        commentaire: str, formateur: str) -> bool:
        """Envoie un email de notification d'évaluation de travail à l'étudiant"""
        if not self.api_token or not self.inbox_id:
            print("❌ ERREUR: MAILTRAP_TOKEN ou MAILTRAP_INBOX_ID non configurée", flush=True)
            return False

        print(f"📧 [MAILTRAP] Notification d'évaluation pour {destinataire}...", flush=True)
        
        # Déterminer la couleur selon la note
        pourcentage = (note / note_max) * 100
        if pourcentage >= 80:
            couleur_note = "#16a34a"  # Vert
            emoji_note = "🎉"
        elif pourcentage >= 60:
            couleur_note = "#f59e0b"  # Orange
            emoji_note = "👍"
        else:
            couleur_note = "#dc2626"  # Rouge
            emoji_note = "📚"
        
        corps_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: {couleur_note};">{emoji_note} Votre travail a été évalué !</h2>
                <p>Bonjour <strong>{prenom_etudiant}</strong>,</p>
                <p>Votre formateur <strong>{formateur}</strong> vient d'évaluer votre travail dans la matière <strong>{nom_matiere}</strong>.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin-top: 0;"><strong>Travail :</strong> {titre_travail}</p>
                    <div style="background-color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 10px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: {couleur_note};">{note}/{note_max}</span>
                        <span style="font-size: 14px; color: #666; margin-left: 10px;">({pourcentage:.1f}%)</span>
                    </div>
                    <p style="margin-bottom: 0;"><strong>Commentaire du formateur :</strong><br><em>{commentaire}</em></p>
                </div>
                
                <p>Connectez-vous à votre espace étudiant pour consulter les détails de votre évaluation.</p>
                <br>
                <p>Cordialement,<br>L'équipe pédagogique UATM</p>
            </div>
        </body>
        </html>
        """
        
        payload = {
            "from": {"email": self.email_sender, "name": self.sender_name},
            "to": [{"email": destinataire}],
            "subject": f"📊 Note reçue : {titre_travail} - {note}/{note_max}",
            "html": corps_html
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(self.api_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                print(f"✅ Email d'évaluation capturé par Mailtrap !", flush=True)
                return True
            else:
                print(f"❌ Erreur Mailtrap ({response.status_code}): {response.text}", flush=True)
                return False
        except Exception as e:
            print(f"❌ Erreur critique API Mailtrap: {e}", flush=True)
            return False

# Instance globale du service email
email_service = EmailService()
