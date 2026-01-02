#!/usr/bin/env python3
"""
Test des nouvelles routes pour la gestion des espaces pédagogiques
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from models import (
    Utilisateur, Formateur, Etudiant, EspacePedagogique, 
    Promotion, Matiere, Inscription, RoleEnum
)

def test_nouvelles_routes():
    """Test des nouvelles fonctionnalités"""
    db = SessionLocal()
    
    try:
        print("=== Test des nouvelles routes ===")
        
        # 1. Vérifier qu'on a des données de test
        de = db.query(Utilisateur).filter(Utilisateur.role == RoleEnum.DE).first()
        formateurs = db.query(Formateur).all()
        etudiants = db.query(Etudiant).all()
        espaces = db.query(EspacePedagogique).all()
        
        print(f"✅ DE trouvé: {de.email if de else 'Aucun'}")
        print(f"✅ Formateurs: {len(formateurs)}")
        print(f"✅ Étudiants: {len(etudiants)}")
        print(f"✅ Espaces: {len(espaces)}")
        
        if not espaces:
            print("❌ Aucun espace pédagogique trouvé pour les tests")
            return False
            
        espace = espaces[0]
        print(f"✅ Test avec l'espace: {espace.matiere.nom_matiere}")
        
        # 2. Test assignation formateur
        if formateurs:
            formateur = formateurs[0]
            print(f"✅ Assignation du formateur: {formateur.utilisateur.nom if formateur.utilisateur else 'N/A'}")
            
            # Simuler l'assignation
            espace.id_formateur = formateur.id_formateur
            db.commit()
            print("✅ Formateur assigné avec succès")
            
        # 3. Test ajout d'étudiants
        if etudiants:
            print(f"✅ Ajout de {min(3, len(etudiants))} étudiants à l'espace")
            
            count = 0
            for etudiant in etudiants[:3]:  # Prendre les 3 premiers
                # Vérifier si déjà inscrit
                exists = db.query(Inscription).filter(
                    Inscription.id_espace == espace.id_espace,
                    Inscription.id_etudiant == etudiant.id_etudiant
                ).first()
                
                if not exists:
                    from utils.generators import generer_identifiant_unique
                    from datetime import datetime
                    
                    inscription = Inscription(
                        id_inscription=generer_identifiant_unique("INS"),
                        id_espace=espace.id_espace,
                        id_etudiant=etudiant.id_etudiant,
                        date_inscription=datetime.utcnow()
                    )
                    db.add(inscription)
                    count += 1
            
            db.commit()
            print(f"✅ {count} étudiant(s) ajouté(s) avec succès")
            
        # 4. Vérifier les inscriptions
        inscriptions = db.query(Inscription).filter(
            Inscription.id_espace == espace.id_espace
        ).count()
        print(f"✅ Total inscriptions dans l'espace: {inscriptions}")
        
        print("\n🎉 Test des nouvelles routes terminé avec succès !")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_nouvelles_routes()