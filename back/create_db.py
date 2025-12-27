import pymysql

def create_database():
    print("Tentative de connexion à MySQL...")
    try:
        # Connexion au serveur MySQL (root / sans mot de passe)
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )

        with connection.cursor() as cursor:
            # Création de la base
            sql = "CREATE DATABASE IF NOT EXISTS simulation_groupe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            cursor.execute(sql)
            print("✅ Base de données 'simulation_groupe' créée avec succès (ou existait déjà).")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création de la base : {e}")
        print("Assurez-vous que XAMPP/WAMP/MySQL est bien lancé et que l'utilisateur root n'a pas de mot de passe.")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    create_database()
