-- AlterTable: User に favoriteMoon を追加 (FavoriteMoon の和名 16 種、null = 未設定)
ALTER TABLE "users" ADD COLUMN "favoriteMoon" TEXT;
