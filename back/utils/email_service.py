import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import os

class EmailService:
    def __init__(self):
        # Utilise les variables d'environnement de Render ou les valeurs par défaut (insecure pour la prod mais permet le secours)
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email_sender = os.getenv("EMAIL_SENDER", "tfxyesu@gmail.com")
        self.email_password = os.getenv("EMAIL_PASSWORD", "ybbc zyld mxbj olui")
    
    def envoyer_email_creation_compte(self, destinataire: str, prenom: str, 
                                     email: str, mot_de_passe: str, role: str) -> bool:
        """Envoie un email de création de compte avec identifiants"""
        print(f"📧 Préparation de l'envoi d'email à {destinataire}...", flush=True)
        try:
            # Création du message
            message = MIMEMultipart()
            message["From"] = self.email_sender
            message["To"] = destinataire
            message["Subject"] = f"Création de votre compte {role.lower()}"
            
            # Corps du message
            corps_message = f"""
Bonjour {prenom},

Votre compte {role.lower()} a été créé par le Directeur d'Établissement.

Voici vos informations de connexion :
• Email : {email}
• Mot de passe : {mot_de_passe}
• Rôle : {role}

🔗 Pour vous connecter :
Rendez-vous sur le site et connectez-vous avec ces identifiants.

⚠️ Important :
- Lors de votre première connexion, vous devrez obligatoirement changer votre mot de passe
- Conservez ces informations en sécurité

Si vous n'avez pas demandé la création de ce compte, veuillez ignorer cet email.

Cordialement,
L'équipe administrative
            """
            
            message.attach(MIMEText(corps_message, "plain", "utf-8"))
            
            # Envoi de l'email
            if self.email_password:
                print(f"📡 Connexion au serveur SMTP {self.smtp_server}:{self.smtp_port}...", flush=True)
                
                # Utiliser SSL pour le port 465, TLS pour 587
                if self.smtp_port == 465:
                    server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, timeout=10)
                else:
                    server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10)
                    server.starttls()
                    
                print(f"🔑 Tentative de connexion (Login) pour {self.email_sender}...", flush=True)
                server.login(self.email_sender, self.email_password)
                print(f"📤 Envoi du message...", flush=True)
                server.send_message(message)
                server.quit()
                print(f"✅ Email envoyé avec succès à {destinataire} !", flush=True)
                return True
            else:
                print("❌ ERREUR: Mot de passe email non configuré (EMAIL_PASSWORD manquant)", flush=True)
                return False
                
        except Exception as e:
            print(f"❌ ERREUR CRITIQUE lors de l'envoi de l'email: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return False

    def envoyer_email_assignation_travail(self, destinataire: str, prenom: str,
                                         titre_travail: str, nom_matiere: str,
                                         formateur: str, date_echeance: str,
                                         description: str) -> bool:
        """Envoie un email de notification d'assignation de travail"""
        print(f"📧 Notification Nouveau Travail pour {destinataire}...")
        try:
            message = MIMEMultipart()
            message["From"] = self.email_sender
            message["To"] = destinataire
            message["Subject"] = f"Nouveau travail assigné : {titre_travail}"
            
            corps_message = f"""
Bonjour {prenom},

Un nouveau travail vous a été assigné dans le cours {nom_matiere}.

📋 Détails du travail :
• Titre : {titre_travail}
• Matière : {nom_matiere}
• Formateur : {formateur}
• Date d'échéance : {date_echeance}

📝 Description :
{description}

🔗 Pour consulter et soumettre votre travail :
Connectez-vous à votre espace étudiant sur la plateforme.

⚠️ Important :
- Respectez la date d'échéance
- Consultez régulièrement vos travaux assignés
- Contactez votre formateur en cas de questions

Bon travail !

L'équipe pédagogique
            """
            
            message.attach(MIMEText(corps_message, "plain", "utf-8"))
            
            if self.email_password:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10)
                server.starttls()
                server.login(self.email_sender, self.email_password)
                server.send_message(message)
                server.quit()
                print(f"✅ Email de travail envoyé à {destinataire}")
                return True
            else:
                print("❌ ERREUR: Mot de passe email non configuré")
                return False
                
        except Exception as e:
            print(f"❌ Erreur envoi email assignation: {e}")
            return False

# Instance globale du service email
email_service = EmailService()
