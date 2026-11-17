-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: judging
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '52cb01f2-064f-11f1-bb06-3782e90b7736:1-8782';

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('92610708-cb54-4c9d-a30e-1ac64bff8785','66087f81ba2e551454eb935944939a9391ee6c3e22b9627c9fd36c5dc32eb7d6','2026-11-12 02:32:43.267','20261110032257_init',NULL,NULL,'2026-11-12 02:32:43.095',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `aksi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entitas` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entitas_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_lama` json DEFAULT NULL,
  `data_baru` json DEFAULT NULL,
  `ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_log_created_at_idx` (`created_at`),
  KEY `audit_log_aksi_idx` (`aksi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_setting`
--

DROP TABLE IF EXISTS `event_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_setting` (
  `id` int NOT NULL,
  `nama` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fase` enum('PERSIAPAN','PENJURIAN','SELESAI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERSIAPAN',
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_setting`
--

LOCK TABLES `event_setting` WRITE;
/*!40000 ALTER TABLE `event_setting` DISABLE KEYS */;
INSERT INTO `event_setting` VALUES (1,'MBtech Riding With Style Awards 2026','PENJURIAN','2026-11-12 02:36:10.212');
/*!40000 ALTER TABLE `event_setting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `juri`
--

DROP TABLE IF EXISTS `juri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `juri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode_juri` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `juri_kode_juri_key` (`kode_juri`),
  UNIQUE KEY `juri_user_id_key` (`user_id`),
  CONSTRAINT `juri_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `juri`
--

LOCK TABLES `juri` WRITE;
/*!40000 ALTER TABLE `juri` DISABLE KEYS */;
INSERT INTO `juri` VALUES (1,'J01','Juri Satu',2,1,NULL,'2026-11-12 02:36:10.266'),(2,'J02','Juri Dua',3,1,NULL,'2026-11-12 02:36:10.269'),(3,'J03','Juri Tiga',4,1,NULL,'2026-11-12 02:36:10.271');
/*!40000 ALTER TABLE `juri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `karya`
--

DROP TABLE IF EXISTS `karya`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `karya` (
  `id` int NOT NULL AUTO_INCREMENT,
  `peserta_id` int NOT NULL,
  `akronim_karya` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_urut` int NOT NULL,
  `kode_karya` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_karya` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `karya_kode_karya_key` (`kode_karya`),
  UNIQUE KEY `karya_peserta_id_no_urut_key` (`peserta_id`,`no_urut`),
  CONSTRAINT `karya_peserta_id_fkey` FOREIGN KEY (`peserta_id`) REFERENCES `peserta` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_akronim_karya` CHECK (regexp_like(`akronim_karya`,_utf8mb4'^[A-Z0-9]{2,5}$')),
  CONSTRAINT `chk_no_urut` CHECK ((`no_urut` between 1 and 999))
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `karya`
--

LOCK TABLES `karya` WRITE;
/*!40000 ALTER TABLE `karya` DISABLE KEYS */;
INSERT INTO `karya` VALUES (1,1,'RW',1,'001','Nomor 001',NULL,NULL,'2026-11-12 02:36:10.286','2026-11-12 02:36:10.286'),(2,2,'RW',1,'002','Nomor 002',NULL,NULL,'2026-11-12 02:36:10.290','2026-11-12 02:36:10.290'),(3,3,'RW',1,'003','Nomor 003',NULL,NULL,'2026-11-12 02:36:10.295','2026-11-12 02:36:10.295'),(4,4,'RW',1,'004','Nomor 004',NULL,NULL,'2026-11-12 02:36:10.299','2026-11-12 02:36:10.299'),(5,5,'RW',1,'005','Nomor 005',NULL,NULL,'2026-11-12 02:36:10.302','2026-11-12 02:36:10.302'),(6,6,'RW',1,'006','Nomor 006',NULL,NULL,'2026-11-12 02:36:10.305','2026-11-12 02:36:10.305'),(7,7,'RW',1,'007','Nomor 007',NULL,NULL,'2026-11-12 02:36:10.307','2026-11-12 02:36:10.307'),(8,8,'RW',1,'008','Nomor 008',NULL,NULL,'2026-11-12 02:36:10.309','2026-11-12 02:36:10.309'),(9,9,'RW',1,'009','Nomor 009',NULL,NULL,'2026-11-12 02:36:10.310','2026-11-12 02:36:10.310'),(10,10,'RW',1,'010','Nomor 010',NULL,NULL,'2026-11-12 02:36:10.312','2026-11-12 02:36:10.312'),(11,11,'RW',1,'011','Nomor 011',NULL,NULL,'2026-11-12 02:36:10.313','2026-11-12 02:36:10.313'),(12,12,'RW',1,'012','Nomor 012',NULL,NULL,'2026-11-12 02:36:10.315','2026-11-12 02:36:10.315'),(13,13,'RW',1,'013','Nomor 013',NULL,NULL,'2026-11-12 02:36:10.316','2026-11-12 02:36:10.316'),(14,14,'RW',1,'014','Nomor 014',NULL,NULL,'2026-11-12 02:36:10.318','2026-11-12 02:36:10.318'),(15,15,'RW',1,'015','Nomor 015',NULL,NULL,'2026-11-12 02:36:10.320','2026-11-12 02:36:10.320'),(16,16,'RW',1,'016','Nomor 016',NULL,NULL,'2026-11-12 02:36:10.323','2026-11-12 02:36:10.323'),(17,17,'RW',1,'017','Nomor 017',NULL,NULL,'2026-11-12 02:36:10.327','2026-11-12 02:36:10.327'),(18,18,'RW',1,'018','Nomor 018',NULL,NULL,'2026-11-12 02:36:10.330','2026-11-12 02:36:10.330'),(19,19,'RW',1,'019','Nomor 019',NULL,NULL,'2026-11-12 02:36:10.332','2026-11-12 02:36:10.332'),(20,20,'RW',1,'020','Nomor 020',NULL,NULL,'2026-11-12 02:36:10.336','2026-11-12 02:36:10.336'),(21,21,'RW',1,'021','Nomor 021',NULL,NULL,'2026-11-12 02:36:10.338','2026-11-12 02:36:10.338'),(22,22,'RW',1,'022','Nomor 022',NULL,NULL,'2026-11-12 02:36:10.340','2026-11-12 02:36:10.340'),(23,23,'RW',1,'023','Nomor 023',NULL,NULL,'2026-11-12 02:36:10.342','2026-11-12 02:36:10.342'),(24,24,'RW',1,'024','Nomor 024',NULL,NULL,'2026-11-12 02:36:10.344','2026-11-12 02:36:10.344'),(25,25,'RW',1,'025','Nomor 025',NULL,NULL,'2026-11-12 02:36:10.345','2026-11-12 02:36:10.345'),(26,26,'RW',1,'026','Nomor 026',NULL,NULL,'2026-11-12 02:36:10.347','2026-11-12 02:36:10.347'),(27,27,'RW',1,'027','Nomor 027',NULL,NULL,'2026-11-12 02:36:10.348','2026-11-12 02:36:10.348'),(28,28,'RW',1,'028','Nomor 028',NULL,NULL,'2026-11-12 02:36:10.350','2026-11-12 02:36:10.350'),(29,29,'RW',1,'029','Nomor 029',NULL,NULL,'2026-11-12 02:36:10.352','2026-11-12 02:36:10.352'),(30,30,'RW',1,'030','Nomor 030',NULL,NULL,'2026-11-12 02:36:10.353','2026-11-12 02:36:10.353'),(31,31,'RW',1,'031','Nomor 031',NULL,NULL,'2026-11-12 02:36:10.355','2026-11-12 02:36:10.355'),(32,32,'RW',1,'032','Nomor 032',NULL,NULL,'2026-11-12 02:36:10.357','2026-11-12 02:36:10.357'),(33,33,'RW',1,'033','Nomor 033',NULL,NULL,'2026-11-12 02:36:10.360','2026-11-12 02:36:10.360'),(34,34,'RW',1,'034','Nomor 034',NULL,NULL,'2026-11-12 02:36:10.361','2026-11-12 02:36:10.361'),(35,35,'RW',1,'035','Nomor 035',NULL,NULL,'2026-11-12 02:36:10.364','2026-11-12 02:36:10.364'),(36,36,'RW',1,'036','Nomor 036',NULL,NULL,'2026-11-12 02:36:10.366','2026-11-12 02:36:10.366'),(37,37,'RW',1,'037','Nomor 037',NULL,NULL,'2026-11-12 02:36:10.369','2026-11-12 02:36:10.369'),(38,38,'RW',1,'038','Nomor 038',NULL,NULL,'2026-11-12 02:36:10.371','2026-11-12 02:36:10.371'),(39,39,'RW',1,'039','Nomor 039',NULL,NULL,'2026-11-12 02:36:10.375','2026-11-12 02:36:10.375'),(40,40,'RW',1,'040','Nomor 040',NULL,NULL,'2026-11-12 02:36:10.378','2026-11-12 02:36:10.378'),(41,41,'RW',1,'041','Nomor 041',NULL,NULL,'2026-11-12 02:36:10.381','2026-11-12 02:36:10.381'),(42,42,'RW',1,'042','Nomor 042',NULL,NULL,'2026-11-12 02:36:10.385','2026-11-12 02:36:10.385'),(43,43,'RW',1,'043','Nomor 043',NULL,NULL,'2026-11-12 02:36:10.388','2026-11-12 02:36:10.388'),(44,44,'RW',1,'044','Nomor 044',NULL,NULL,'2026-11-12 02:36:10.391','2026-11-12 02:36:10.391'),(45,45,'RW',1,'045','Nomor 045',NULL,NULL,'2026-11-12 02:36:10.394','2026-11-12 02:36:10.394'),(46,46,'RW',1,'046','Nomor 046',NULL,NULL,'2026-11-12 02:36:10.396','2026-11-12 02:36:10.396'),(47,47,'RW',1,'047','Nomor 047',NULL,NULL,'2026-11-12 02:36:10.401','2026-11-12 02:36:10.401'),(48,48,'RW',1,'048','Nomor 048',NULL,NULL,'2026-11-12 02:36:10.415','2026-11-12 02:36:10.415'),(49,49,'RW',1,'049','Nomor 049',NULL,NULL,'2026-11-12 02:36:10.438','2026-11-12 02:36:10.438'),(50,50,'RW',1,'050','Nomor 050',NULL,NULL,'2026-11-12 02:36:10.470','2026-11-12 02:36:10.470'),(51,51,'RW',1,'051','Nomor 051',NULL,NULL,'2026-11-12 02:36:10.485','2026-11-12 02:36:10.485'),(52,52,'RW',1,'052','Nomor 052',NULL,NULL,'2026-11-12 02:36:10.503','2026-11-12 02:36:10.503'),(53,53,'RW',1,'053','Nomor 053',NULL,NULL,'2026-11-12 02:36:10.515','2026-11-12 02:36:10.515'),(54,54,'RW',1,'054','Nomor 054',NULL,NULL,'2026-11-12 02:36:10.524','2026-11-12 02:36:10.524'),(55,55,'RW',1,'055','Nomor 055',NULL,NULL,'2026-11-12 02:36:10.534','2026-11-12 02:36:10.534'),(56,56,'RW',1,'056','Nomor 056',NULL,NULL,'2026-11-12 02:36:10.544','2026-11-12 02:36:10.544'),(57,57,'RW',1,'057','Nomor 057',NULL,NULL,'2026-11-12 02:36:10.550','2026-11-12 02:36:10.550'),(58,58,'RW',1,'058','Nomor 058',NULL,NULL,'2026-11-12 02:36:10.554','2026-11-12 02:36:10.554'),(59,59,'RW',1,'059','Nomor 059',NULL,NULL,'2026-11-12 02:36:10.557','2026-11-12 02:36:10.557'),(60,60,'RW',1,'060','Nomor 060',NULL,NULL,'2026-11-12 02:36:10.563','2026-11-12 02:36:10.563'),(61,61,'RW',1,'061','Nomor 061',NULL,NULL,'2026-11-12 02:36:10.567','2026-11-12 02:36:10.567'),(62,62,'RW',1,'062','Nomor 062',NULL,NULL,'2026-11-12 02:36:10.573','2026-11-12 02:36:10.573'),(63,63,'RW',1,'063','Nomor 063',NULL,NULL,'2026-11-12 02:36:10.578','2026-11-12 02:36:10.578'),(64,64,'RW',1,'064','Nomor 064',NULL,NULL,'2026-11-12 02:36:10.582','2026-11-12 02:36:10.582'),(65,65,'RW',1,'065','Nomor 065',NULL,NULL,'2026-11-12 02:36:10.586','2026-11-12 02:36:10.586'),(66,66,'RW',1,'066','Nomor 066',NULL,NULL,'2026-11-12 02:36:10.591','2026-11-12 02:36:10.591'),(67,67,'RW',1,'067','Nomor 067',NULL,NULL,'2026-11-12 02:36:10.595','2026-11-12 02:36:10.595'),(68,68,'RW',1,'068','Nomor 068',NULL,NULL,'2026-11-12 02:36:10.598','2026-11-12 02:36:10.598'),(69,69,'RW',1,'069','Nomor 069',NULL,NULL,'2026-11-12 02:36:10.604','2026-11-12 02:36:10.604'),(70,70,'RW',1,'070','Nomor 070',NULL,NULL,'2026-11-12 02:36:10.609','2026-11-12 02:36:10.609'),(71,71,'RW',1,'071','Nomor 071',NULL,NULL,'2026-11-12 02:36:10.626','2026-11-12 02:36:10.626'),(72,72,'RW',1,'072','Nomor 072',NULL,NULL,'2026-11-12 02:36:10.640','2026-11-12 02:36:10.640'),(73,73,'RW',1,'073','Nomor 073',NULL,NULL,'2026-11-12 02:36:10.644','2026-11-12 02:36:10.644'),(74,74,'RW',1,'074','Nomor 074',NULL,NULL,'2026-11-12 02:36:10.649','2026-11-12 02:36:10.649'),(75,75,'RW',1,'075','Nomor 075',NULL,NULL,'2026-11-12 02:36:10.651','2026-11-12 02:36:10.651'),(76,76,'RW',1,'076','Nomor 076',NULL,NULL,'2026-11-12 02:36:10.654','2026-11-12 02:36:10.654'),(77,77,'RW',1,'077','Nomor 077',NULL,NULL,'2026-11-12 02:36:10.656','2026-11-12 02:36:10.656'),(78,78,'RW',1,'078','Nomor 078',NULL,NULL,'2026-11-12 02:36:10.657','2026-11-12 02:36:10.657'),(79,79,'RW',1,'079','Nomor 079',NULL,NULL,'2026-11-12 02:36:10.659','2026-11-12 02:36:10.659'),(80,80,'RW',1,'080','Nomor 080',NULL,NULL,'2026-11-12 02:36:10.661','2026-11-12 02:36:10.661'),(81,81,'RW',1,'081','Nomor 081',NULL,NULL,'2026-11-12 02:36:10.664','2026-11-12 02:36:10.664'),(82,82,'RW',1,'082','Nomor 082',NULL,NULL,'2026-11-12 02:36:10.666','2026-11-12 02:36:10.666'),(83,83,'RW',1,'083','Nomor 083',NULL,NULL,'2026-11-12 02:36:10.669','2026-11-12 02:36:10.669'),(84,84,'RW',1,'084','Nomor 084',NULL,NULL,'2026-11-12 02:36:10.671','2026-11-12 02:36:10.671'),(85,85,'RW',1,'085','Nomor 085',NULL,NULL,'2026-11-12 02:36:10.673','2026-11-12 02:36:10.673'),(86,86,'RW',1,'086','Nomor 086',NULL,NULL,'2026-11-12 02:36:10.675','2026-11-12 02:36:10.675'),(87,87,'RW',1,'087','Nomor 087',NULL,NULL,'2026-11-12 02:36:10.676','2026-11-12 02:36:10.676'),(88,88,'RW',1,'088','Nomor 088',NULL,NULL,'2026-11-12 02:36:10.678','2026-11-12 02:36:10.678'),(89,89,'RW',1,'089','Nomor 089',NULL,NULL,'2026-11-12 02:36:10.680','2026-11-12 02:36:10.680'),(90,90,'RW',1,'090','Nomor 090',NULL,NULL,'2026-11-12 02:36:10.682','2026-11-12 02:36:10.682'),(91,91,'RW',1,'091','Nomor 091',NULL,NULL,'2026-11-12 02:36:10.686','2026-11-12 02:36:10.686'),(92,92,'RW',1,'092','Nomor 092',NULL,NULL,'2026-11-12 02:36:10.689','2026-11-12 02:36:10.689'),(93,93,'RW',1,'093','Nomor 093',NULL,NULL,'2026-11-12 02:36:10.691','2026-11-12 02:36:10.691'),(94,94,'RW',1,'094','Nomor 094',NULL,NULL,'2026-11-12 02:36:10.693','2026-11-12 02:36:10.693'),(95,95,'RW',1,'095','Nomor 095',NULL,NULL,'2026-11-12 02:36:10.695','2026-11-12 02:36:10.695'),(96,96,'RW',1,'096','Nomor 096',NULL,NULL,'2026-11-12 02:36:10.697','2026-11-12 02:36:10.697'),(97,97,'RW',1,'097','Nomor 097',NULL,NULL,'2026-11-12 02:36:10.699','2026-11-12 02:36:10.699'),(98,98,'RW',1,'098','Nomor 098',NULL,NULL,'2026-11-12 02:36:10.700','2026-11-12 02:36:10.700'),(99,99,'RW',1,'099','Nomor 099',NULL,NULL,'2026-11-12 02:36:10.702','2026-11-12 02:36:10.702'),(100,100,'RW',1,'100','Nomor 100',NULL,NULL,'2026-11-12 02:36:10.704','2026-11-12 02:36:10.704'),(101,101,'RW',1,'101','Nomor 101',NULL,NULL,'2026-11-12 02:36:10.706','2026-11-12 02:36:10.706'),(102,102,'RW',1,'102','Nomor 102',NULL,NULL,'2026-11-12 02:36:10.707','2026-11-12 02:36:10.707'),(103,103,'RW',1,'103','Nomor 103',NULL,NULL,'2026-11-12 02:36:10.709','2026-11-12 02:36:10.709'),(104,104,'RW',1,'104','Nomor 104',NULL,NULL,'2026-11-12 02:36:10.711','2026-11-12 02:36:10.711'),(105,105,'RW',1,'105','Nomor 105',NULL,NULL,'2026-11-12 02:36:10.713','2026-11-12 02:36:10.713'),(106,106,'RW',1,'106','Nomor 106',NULL,NULL,'2026-11-12 02:36:10.717','2026-11-12 02:36:10.717'),(107,107,'RW',1,'107','Nomor 107',NULL,NULL,'2026-11-12 02:36:10.721','2026-11-12 02:36:10.721'),(108,108,'RW',1,'108','Nomor 108',NULL,NULL,'2026-11-12 02:36:10.724','2026-11-12 02:36:10.724'),(109,109,'RW',1,'109','Nomor 109',NULL,NULL,'2026-11-12 02:36:10.727','2026-11-12 02:36:10.727'),(110,110,'RW',1,'110','Nomor 110',NULL,NULL,'2026-11-12 02:36:10.730','2026-11-12 02:36:10.730'),(111,111,'RW',1,'111','Nomor 111',NULL,NULL,'2026-11-12 02:36:10.732','2026-11-12 02:36:10.732'),(112,112,'RW',1,'112','Nomor 112',NULL,NULL,'2026-11-12 02:36:10.734','2026-11-12 02:36:10.734'),(113,113,'RW',1,'113','Nomor 113',NULL,NULL,'2026-11-12 02:36:10.738','2026-11-12 02:36:10.738'),(114,114,'RW',1,'114','Nomor 114',NULL,NULL,'2026-11-12 02:36:10.740','2026-11-12 02:36:10.740'),(115,115,'RW',1,'115','Nomor 115',NULL,NULL,'2026-11-12 02:36:10.742','2026-11-12 02:36:10.742'),(116,116,'RW',1,'116','Nomor 116',NULL,NULL,'2026-11-12 02:36:10.743','2026-11-12 02:36:10.743'),(117,117,'RW',1,'117','Nomor 117',NULL,NULL,'2026-11-12 02:36:10.747','2026-11-12 02:36:10.747'),(118,118,'RW',1,'118','Nomor 118',NULL,NULL,'2026-11-12 02:36:10.750','2026-11-12 02:36:10.750'),(119,119,'RW',1,'119','Nomor 119',NULL,NULL,'2026-11-12 02:36:10.754','2026-11-12 02:36:10.754'),(120,120,'RW',1,'120','Nomor 120',NULL,NULL,'2026-11-12 02:36:10.757','2026-11-12 02:36:10.757'),(121,121,'RW',1,'121','Nomor 121',NULL,NULL,'2026-11-12 02:36:10.759','2026-11-12 02:36:10.759'),(122,122,'RW',1,'122','Nomor 122',NULL,NULL,'2026-11-12 02:36:10.762','2026-11-12 02:36:10.762'),(123,123,'RW',1,'123','Nomor 123',NULL,NULL,'2026-11-12 02:36:10.764','2026-11-12 02:36:10.764'),(124,124,'RW',1,'124','Nomor 124',NULL,NULL,'2026-11-12 02:36:10.765','2026-11-12 02:36:10.765'),(125,125,'RW',1,'125','Nomor 125',NULL,NULL,'2026-11-12 02:36:10.767','2026-11-12 02:36:10.767'),(126,126,'RW',1,'126','Nomor 126',NULL,NULL,'2026-11-12 02:36:10.770','2026-11-12 02:36:10.770'),(127,127,'RW',1,'127','Nomor 127',NULL,NULL,'2026-11-12 02:36:10.772','2026-11-12 02:36:10.772'),(128,128,'RW',1,'128','Nomor 128',NULL,NULL,'2026-11-12 02:36:10.774','2026-11-12 02:36:10.774'),(129,129,'RW',1,'129','Nomor 129',NULL,NULL,'2026-11-12 02:36:10.776','2026-11-12 02:36:10.776'),(130,130,'RW',1,'130','Nomor 130',NULL,NULL,'2026-11-12 02:36:10.779','2026-11-12 02:36:10.779'),(131,131,'RW',1,'131','Nomor 131',NULL,NULL,'2026-11-12 02:36:10.783','2026-11-12 02:36:10.783'),(132,132,'RW',1,'132','Nomor 132',NULL,NULL,'2026-11-12 02:36:10.786','2026-11-12 02:36:10.786'),(133,133,'RW',1,'133','Nomor 133',NULL,NULL,'2026-11-12 02:36:10.790','2026-11-12 02:36:10.790'),(134,134,'RW',1,'134','Nomor 134',NULL,NULL,'2026-11-12 02:36:10.792','2026-11-12 02:36:10.792'),(135,135,'RW',1,'135','Nomor 135',NULL,NULL,'2026-11-12 02:36:10.798','2026-11-12 02:36:10.798'),(136,136,'RW',1,'136','Nomor 136',NULL,NULL,'2026-11-12 02:36:10.801','2026-11-12 02:36:10.801'),(137,137,'RW',1,'137','Nomor 137',NULL,NULL,'2026-11-12 02:36:10.804','2026-11-12 02:36:10.804'),(138,138,'RW',1,'138','Nomor 138',NULL,NULL,'2026-11-12 02:36:10.806','2026-11-12 02:36:10.806'),(139,139,'RW',1,'139','Nomor 139',NULL,NULL,'2026-11-12 02:36:10.808','2026-11-12 02:36:10.808'),(140,140,'RW',1,'140','Nomor 140',NULL,NULL,'2026-11-12 02:36:10.809','2026-11-12 02:36:10.809'),(141,141,'RW',1,'141','Nomor 141',NULL,NULL,'2026-11-12 02:36:10.811','2026-11-12 02:36:10.811'),(142,142,'RW',1,'142','Nomor 142',NULL,NULL,'2026-11-12 02:36:10.813','2026-11-12 02:36:10.813'),(143,143,'RW',1,'143','Nomor 143',NULL,NULL,'2026-11-12 02:36:10.815','2026-11-12 02:36:10.815'),(144,144,'RW',1,'144','Nomor 144',NULL,NULL,'2026-11-12 02:36:10.816','2026-11-12 02:36:10.816'),(145,145,'RW',1,'145','Nomor 145',NULL,NULL,'2026-11-12 02:36:10.818','2026-11-12 02:36:10.818'),(146,146,'RW',1,'146','Nomor 146',NULL,NULL,'2026-11-12 02:36:10.821','2026-11-12 02:36:10.821'),(147,147,'RW',1,'147','Nomor 147',NULL,NULL,'2026-11-12 02:36:10.823','2026-11-12 02:36:10.823'),(148,148,'RW',1,'148','Nomor 148',NULL,NULL,'2026-11-12 02:36:10.825','2026-11-12 02:36:10.825'),(149,149,'RW',1,'149','Nomor 149',NULL,NULL,'2026-11-12 02:36:10.827','2026-11-12 02:36:10.827'),(150,150,'RW',1,'150','Nomor 150',NULL,NULL,'2026-11-12 02:36:10.829','2026-11-12 02:36:10.829'),(151,151,'RW',1,'151','Nomor 151',NULL,NULL,'2026-11-12 02:36:10.831','2026-11-12 02:36:10.831'),(152,152,'RW',1,'152','Nomor 152',NULL,NULL,'2026-11-12 02:36:10.833','2026-11-12 02:36:10.833'),(153,153,'RW',1,'153','Nomor 153',NULL,NULL,'2026-11-12 02:36:10.835','2026-11-12 02:36:10.835'),(154,154,'RW',1,'154','Nomor 154',NULL,NULL,'2026-11-12 02:36:10.838','2026-11-12 02:36:10.838'),(155,155,'RW',1,'155','Nomor 155',NULL,NULL,'2026-11-12 02:36:10.840','2026-11-12 02:36:10.840'),(156,156,'RW',1,'156','Nomor 156',NULL,NULL,'2026-11-12 02:36:10.843','2026-11-12 02:36:10.843'),(157,157,'RW',1,'157','Nomor 157',NULL,NULL,'2026-11-12 02:36:10.845','2026-11-12 02:36:10.845'),(158,158,'RW',1,'158','Nomor 158',NULL,NULL,'2026-11-12 02:36:10.847','2026-11-12 02:36:10.847'),(159,159,'RW',1,'159','Nomor 159',NULL,NULL,'2026-11-12 02:36:10.849','2026-11-12 02:36:10.849'),(160,160,'RW',1,'160','Nomor 160',NULL,NULL,'2026-11-12 02:36:10.851','2026-11-12 02:36:10.851'),(161,161,'RW',1,'161','Nomor 161',NULL,NULL,'2026-11-12 02:36:10.853','2026-11-12 02:36:10.853'),(162,162,'RW',1,'162','Nomor 162',NULL,NULL,'2026-11-12 02:36:10.856','2026-11-12 02:36:10.856'),(163,163,'RW',1,'163','Nomor 163',NULL,NULL,'2026-11-12 02:36:10.858','2026-11-12 02:36:10.858'),(164,164,'RW',1,'164','Nomor 164',NULL,NULL,'2026-11-12 02:36:10.859','2026-11-12 02:36:10.859'),(165,165,'RW',1,'165','Nomor 165',NULL,NULL,'2026-11-12 02:36:10.861','2026-11-12 02:36:10.861'),(166,166,'RW',1,'166','Nomor 166',NULL,NULL,'2026-11-12 02:36:10.863','2026-11-12 02:36:10.863'),(167,167,'RW',1,'167','Nomor 167',NULL,NULL,'2026-11-12 02:36:10.864','2026-11-12 02:36:10.864'),(168,168,'RW',1,'168','Nomor 168',NULL,NULL,'2026-11-12 02:36:10.866','2026-11-12 02:36:10.866'),(169,169,'RW',1,'169','Nomor 169',NULL,NULL,'2026-11-12 02:36:10.867','2026-11-12 02:36:10.867'),(170,170,'RW',1,'170','Nomor 170',NULL,NULL,'2026-11-12 02:36:10.871','2026-11-12 02:36:10.871'),(171,171,'RW',1,'171','Nomor 171',NULL,NULL,'2026-11-12 02:36:10.873','2026-11-12 02:36:10.873'),(172,172,'RW',1,'172','Nomor 172',NULL,NULL,'2026-11-12 02:36:10.875','2026-11-12 02:36:10.875'),(173,173,'RW',1,'173','Nomor 173',NULL,NULL,'2026-11-12 02:36:10.876','2026-11-12 02:36:10.876'),(174,174,'RW',1,'174','Nomor 174',NULL,NULL,'2026-11-12 02:36:10.878','2026-11-12 02:36:10.878'),(175,175,'RW',1,'175','Nomor 175',NULL,NULL,'2026-11-12 02:36:10.880','2026-11-12 02:36:10.880'),(176,176,'RW',1,'176','Nomor 176',NULL,NULL,'2026-11-12 02:36:10.882','2026-11-12 02:36:10.882'),(177,177,'RW',1,'177','Nomor 177',NULL,NULL,'2026-11-12 02:36:10.883','2026-11-12 02:36:10.883'),(178,178,'RW',1,'178','Nomor 178',NULL,NULL,'2026-11-12 02:36:10.885','2026-11-12 02:36:10.885'),(179,179,'RW',1,'179','Nomor 179',NULL,NULL,'2026-11-12 02:36:10.887','2026-11-12 02:36:10.887'),(180,180,'RW',1,'180','Nomor 180',NULL,NULL,'2026-11-12 02:36:10.889','2026-11-12 02:36:10.889'),(181,181,'RW',1,'181','Nomor 181',NULL,NULL,'2026-11-12 02:36:10.891','2026-11-12 02:36:10.891'),(182,182,'RW',1,'182','Nomor 182',NULL,NULL,'2026-11-12 02:36:10.892','2026-11-12 02:36:10.892'),(183,183,'RW',1,'183','Nomor 183',NULL,NULL,'2026-11-12 02:36:10.894','2026-11-12 02:36:10.894'),(184,184,'RW',1,'184','Nomor 184',NULL,NULL,'2026-11-12 02:36:10.898','2026-11-12 02:36:10.898'),(185,185,'RW',1,'185','Nomor 185',NULL,NULL,'2026-11-12 02:36:10.900','2026-11-12 02:36:10.900'),(186,186,'RW',1,'186','Nomor 186',NULL,NULL,'2026-11-12 02:36:10.903','2026-11-12 02:36:10.903'),(187,187,'RW',1,'187','Nomor 187',NULL,NULL,'2026-11-12 02:36:10.905','2026-11-12 02:36:10.905'),(188,188,'RW',1,'188','Nomor 188',NULL,NULL,'2026-11-12 02:36:10.907','2026-11-12 02:36:10.907'),(189,189,'RW',1,'189','Nomor 189',NULL,NULL,'2026-11-12 02:36:10.908','2026-11-12 02:36:10.908'),(190,190,'RW',1,'190','Nomor 190',NULL,NULL,'2026-11-12 02:36:10.909','2026-11-12 02:36:10.909'),(191,191,'RW',1,'191','Nomor 191',NULL,NULL,'2026-11-12 02:36:10.913','2026-11-12 02:36:10.913'),(192,192,'RW',1,'192','Nomor 192',NULL,NULL,'2026-11-12 02:36:10.914','2026-11-12 02:36:10.914'),(193,193,'RW',1,'193','Nomor 193',NULL,NULL,'2026-11-12 02:36:10.916','2026-11-12 02:36:10.916'),(194,194,'RW',1,'194','Nomor 194',NULL,NULL,'2026-11-12 02:36:10.917','2026-11-12 02:36:10.917'),(195,195,'RW',1,'195','Nomor 195',NULL,NULL,'2026-11-12 02:36:10.919','2026-11-12 02:36:10.919'),(196,196,'RW',1,'196','Nomor 196',NULL,NULL,'2026-11-12 02:36:10.922','2026-11-12 02:36:10.922'),(197,197,'RW',1,'197','Nomor 197',NULL,NULL,'2026-11-12 02:36:10.923','2026-11-12 02:36:10.923'),(198,198,'RW',1,'198','Nomor 198',NULL,NULL,'2026-11-12 02:36:10.925','2026-11-12 02:36:10.925'),(199,199,'RW',1,'199','Nomor 199',NULL,NULL,'2026-11-12 02:36:10.927','2026-11-12 02:36:10.927'),(200,200,'RW',1,'200','Nomor 200',NULL,NULL,'2026-11-12 02:36:10.929','2026-11-12 02:36:10.929'),(201,201,'RW',1,'201','Nomor 201',NULL,NULL,'2026-11-12 02:36:10.931','2026-11-12 02:36:10.931'),(202,202,'RW',1,'202','Nomor 202',NULL,NULL,'2026-11-12 02:36:10.933','2026-11-12 02:36:10.933'),(203,203,'RW',1,'203','Nomor 203',NULL,NULL,'2026-11-12 02:36:10.934','2026-11-12 02:36:10.934'),(204,204,'RW',1,'204','Nomor 204',NULL,NULL,'2026-11-12 02:36:10.940','2026-11-12 02:36:10.940'),(205,205,'RW',1,'205','Nomor 205',NULL,NULL,'2026-11-12 02:36:10.942','2026-11-12 02:36:10.942'),(206,206,'RW',1,'206','Nomor 206',NULL,NULL,'2026-11-12 02:36:10.945','2026-11-12 02:36:10.945'),(207,207,'RW',1,'207','Nomor 207',NULL,NULL,'2026-11-12 02:36:10.948','2026-11-12 02:36:10.948'),(208,208,'RW',1,'208','Nomor 208',NULL,NULL,'2026-11-12 02:36:10.951','2026-11-12 02:36:10.951'),(209,209,'RW',1,'209','Nomor 209',NULL,NULL,'2026-11-12 02:36:10.955','2026-11-12 02:36:10.955'),(210,210,'RW',1,'210','Nomor 210',NULL,NULL,'2026-11-12 02:36:10.957','2026-11-12 02:36:10.957'),(211,211,'RW',1,'211','Nomor 211',NULL,NULL,'2026-11-12 02:36:10.959','2026-11-12 02:36:10.959'),(212,212,'RW',1,'212','Nomor 212',NULL,NULL,'2026-11-12 02:36:10.961','2026-11-12 02:36:10.961'),(213,213,'RW',1,'213','Nomor 213',NULL,NULL,'2026-11-12 02:36:10.963','2026-11-12 02:36:10.963'),(214,214,'RW',1,'214','Nomor 214',NULL,NULL,'2026-11-12 02:36:10.965','2026-11-12 02:36:10.965'),(215,215,'RW',1,'215','Nomor 215',NULL,NULL,'2026-11-12 02:36:10.966','2026-11-12 02:36:10.966'),(216,216,'RW',1,'216','Nomor 216',NULL,NULL,'2026-11-12 02:36:10.968','2026-11-12 02:36:10.968'),(217,217,'RW',1,'217','Nomor 217',NULL,NULL,'2026-11-12 02:36:10.970','2026-11-12 02:36:10.970'),(218,218,'RW',1,'218','Nomor 218',NULL,NULL,'2026-11-12 02:36:10.972','2026-11-12 02:36:10.972'),(219,219,'RW',1,'219','Nomor 219',NULL,NULL,'2026-11-12 02:36:10.975','2026-11-12 02:36:10.975'),(220,220,'RW',1,'220','Nomor 220',NULL,NULL,'2026-11-12 02:36:10.978','2026-11-12 02:36:10.978'),(221,221,'RW',1,'221','Nomor 221',NULL,NULL,'2026-11-12 02:36:10.980','2026-11-12 02:36:10.980'),(222,222,'RW',1,'222','Nomor 222',NULL,NULL,'2026-11-12 02:36:10.984','2026-11-12 02:36:10.984'),(223,223,'RW',1,'223','Nomor 223',NULL,NULL,'2026-11-12 02:36:10.987','2026-11-12 02:36:10.987'),(224,224,'RW',1,'224','Nomor 224',NULL,NULL,'2026-11-12 02:36:10.993','2026-11-12 02:36:10.993'),(225,225,'RW',1,'225','Nomor 225',NULL,NULL,'2026-11-12 02:36:11.008','2026-11-12 02:36:11.008'),(226,226,'RW',1,'226','Nomor 226',NULL,NULL,'2026-11-12 02:36:11.031','2026-11-12 02:36:11.031'),(227,227,'RW',1,'227','Nomor 227',NULL,NULL,'2026-11-12 02:36:11.048','2026-11-12 02:36:11.048'),(228,228,'RW',1,'228','Nomor 228',NULL,NULL,'2026-11-12 02:36:11.060','2026-11-12 02:36:11.060'),(229,229,'RW',1,'229','Nomor 229',NULL,NULL,'2026-11-12 02:36:11.071','2026-11-12 02:36:11.071'),(230,230,'RW',1,'230','Nomor 230',NULL,NULL,'2026-11-12 02:36:11.074','2026-11-12 02:36:11.074'),(231,231,'RW',1,'231','Nomor 231',NULL,NULL,'2026-11-12 02:36:11.077','2026-11-12 02:36:11.077'),(232,232,'RW',1,'232','Nomor 232',NULL,NULL,'2026-11-12 02:36:11.080','2026-11-12 02:36:11.080'),(233,233,'RW',1,'233','Nomor 233',NULL,NULL,'2026-11-12 02:36:11.082','2026-11-12 02:36:11.082'),(234,234,'RW',1,'234','Nomor 234',NULL,NULL,'2026-11-12 02:36:11.084','2026-11-12 02:36:11.084'),(235,235,'RW',1,'235','Nomor 235',NULL,NULL,'2026-11-12 02:36:11.088','2026-11-12 02:36:11.088'),(236,236,'RW',1,'236','Nomor 236',NULL,NULL,'2026-11-12 02:36:11.091','2026-11-12 02:36:11.091'),(237,237,'RW',1,'237','Nomor 237',NULL,NULL,'2026-11-12 02:36:11.092','2026-11-12 02:36:11.092'),(238,238,'RW',1,'238','Nomor 238',NULL,NULL,'2026-11-12 02:36:11.096','2026-11-12 02:36:11.096'),(239,239,'RW',1,'239','Nomor 239',NULL,NULL,'2026-11-12 02:36:11.099','2026-11-12 02:36:11.099'),(240,240,'RW',1,'240','Nomor 240',NULL,NULL,'2026-11-12 02:36:11.101','2026-11-12 02:36:11.101'),(241,241,'RW',1,'241','Nomor 241',NULL,NULL,'2026-11-12 02:36:11.105','2026-11-12 02:36:11.105'),(242,242,'RW',1,'242','Nomor 242',NULL,NULL,'2026-11-12 02:36:11.108','2026-11-12 02:36:11.108'),(243,243,'RW',1,'243','Nomor 243',NULL,NULL,'2026-11-12 02:36:11.110','2026-11-12 02:36:11.110'),(244,244,'RW',1,'244','Nomor 244',NULL,NULL,'2026-11-12 02:36:11.114','2026-11-12 02:36:11.114'),(245,245,'RW',1,'245','Nomor 245',NULL,NULL,'2026-11-12 02:36:11.120','2026-11-12 02:36:11.120'),(246,246,'RW',1,'246','Nomor 246',NULL,NULL,'2026-11-12 02:36:11.122','2026-11-12 02:36:11.122'),(247,247,'RW',1,'247','Nomor 247',NULL,NULL,'2026-11-12 02:36:11.123','2026-11-12 02:36:11.123'),(248,248,'RW',1,'248','Nomor 248',NULL,NULL,'2026-11-12 02:36:11.125','2026-11-12 02:36:11.125'),(249,249,'RW',1,'249','Nomor 249',NULL,NULL,'2026-11-12 02:36:11.129','2026-11-12 02:36:11.129'),(250,250,'RW',1,'250','Nomor 250',NULL,NULL,'2026-11-12 02:36:11.132','2026-11-12 02:36:11.132');
/*!40000 ALTER TABLE `karya` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `karya_gambar`
--

DROP TABLE IF EXISTS `karya_gambar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `karya_gambar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `karya_id` int NOT NULL,
  `filename` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumb_filename` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `is_cover` tinyint(1) NOT NULL DEFAULT '0',
  `mime` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `karya_gambar_karya_id_idx` (`karya_id`),
  CONSTRAINT `karya_gambar_karya_id_fkey` FOREIGN KEY (`karya_id`) REFERENCES `karya` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `karya_gambar`
--

LOCK TABLES `karya_gambar` WRITE;
/*!40000 ALTER TABLE `karya_gambar` DISABLE KEYS */;
/*!40000 ALTER TABLE `karya_gambar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kriteria`
--

DROP TABLE IF EXISTS `kriteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kriteria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bobot` decimal(5,2) NOT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kriteria_kode_key` (`kode`),
  CONSTRAINT `chk_bobot_range` CHECK (((`bobot` > 0) and (`bobot` <= 100)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kriteria`
--

LOCK TABLES `kriteria` WRITE;
/*!40000 ALTER TABLE `kriteria` DISABLE KEYS */;
INSERT INTO `kriteria` VALUES (1,'DESIGN','Kreativitas Design','Design jok yang eksklusif, unik dan menarik',30.00,1),(2,'POLA','Kreativitas Pola & Grafis','Keserasian antara pola, paduan warna dan detail grafis pada design jok',30.00,2),(3,'KERJA','Kualitas Pengerjaan','Kerapihan dalam aspek jahitan dan pemasangan',20.00,3),(4,'NYAMAN','Kenyamanan & Penampilan','Aspek kenyamanan jok saat diduduki serta penampilannya',20.00,4);
/*!40000 ALTER TABLE `kriteria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `penilaian`
--

DROP TABLE IF EXISTS `penilaian`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `penilaian` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `juri_id` int NOT NULL,
  `karya_id` int NOT NULL,
  `status` enum('DRAFT','FINAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `skor_juri` decimal(7,4) DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `client_updated_at` bigint NOT NULL DEFAULT '0',
  `finalized_at` datetime(3) DEFAULT NULL,
  `input_oleh` enum('JURI','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'JURI',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `penilaian_client_uuid_key` (`client_uuid`),
  UNIQUE KEY `penilaian_juri_id_karya_id_key` (`juri_id`,`karya_id`),
  KEY `penilaian_karya_id_status_idx` (`karya_id`,`status`),
  CONSTRAINT `penilaian_juri_id_fkey` FOREIGN KEY (`juri_id`) REFERENCES `juri` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `penilaian_karya_id_fkey` FOREIGN KEY (`karya_id`) REFERENCES `karya` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_skor_juri` CHECK (((`skor_juri` is null) or ((`skor_juri` >= 0) and (`skor_juri` <= 100))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `penilaian`
--

LOCK TABLES `penilaian` WRITE;
/*!40000 ALTER TABLE `penilaian` DISABLE KEYS */;
/*!40000 ALTER TABLE `penilaian` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `penilaian_detail`
--

DROP TABLE IF EXISTS `penilaian_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `penilaian_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `penilaian_id` int NOT NULL,
  `kriteria_id` int NOT NULL,
  `nilai` tinyint unsigned NOT NULL,
  `bobot_snapshot` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `penilaian_detail_penilaian_id_kriteria_id_key` (`penilaian_id`,`kriteria_id`),
  KEY `penilaian_detail_kriteria_id_fkey` (`kriteria_id`),
  CONSTRAINT `penilaian_detail_kriteria_id_fkey` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `penilaian_detail_penilaian_id_fkey` FOREIGN KEY (`penilaian_id`) REFERENCES `penilaian` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_nilai_0_100` CHECK ((`nilai` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `penilaian_detail`
--

LOCK TABLES `penilaian_detail` WRITE;
/*!40000 ALTER TABLE `penilaian_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `penilaian_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `penilaian_history`
--

DROP TABLE IF EXISTS `penilaian_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `penilaian_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `penilaian_id` int NOT NULL,
  `juri_id` int NOT NULL,
  `karya_id` int NOT NULL,
  `aksi` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `snapshot` json NOT NULL,
  `actor_user_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `penilaian_history_penilaian_id_idx` (`penilaian_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `penilaian_history`
--

LOCK TABLES `penilaian_history` WRITE;
/*!40000 ALTER TABLE `penilaian_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `penilaian_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `peserta`
--

DROP TABLE IF EXISTS `peserta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `peserta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode_peserta` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `karya_counter` int NOT NULL DEFAULT '0',
  `deleted_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `peserta_kode_peserta_key` (`kode_peserta`),
  CONSTRAINT `chk_kode_peserta` CHECK (regexp_like(`kode_peserta`,_utf8mb4'^[A-Z0-9]{2,5}$'))
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `peserta`
--

LOCK TABLES `peserta` WRITE;
/*!40000 ALTER TABLE `peserta` DISABLE KEYS */;
INSERT INTO `peserta` VALUES (1,'001','Peserta #001',NULL,1,NULL,'2026-11-12 02:36:10.272','2026-11-12 02:36:10.272'),(2,'002','Peserta #002',NULL,1,NULL,'2026-11-12 02:36:10.287','2026-11-12 02:36:10.287'),(3,'003','Peserta #003',NULL,1,NULL,'2026-11-12 02:36:10.294','2026-11-12 02:36:10.294'),(4,'004','Peserta #004',NULL,1,NULL,'2026-11-12 02:36:10.297','2026-11-12 02:36:10.297'),(5,'005','Peserta #005',NULL,1,NULL,'2026-11-12 02:36:10.300','2026-11-12 02:36:10.300'),(6,'006','Peserta #006',NULL,1,NULL,'2026-11-12 02:36:10.304','2026-11-12 02:36:10.304'),(7,'007','Peserta #007',NULL,1,NULL,'2026-11-12 02:36:10.306','2026-11-12 02:36:10.306'),(8,'008','Peserta #008',NULL,1,NULL,'2026-11-12 02:36:10.308','2026-11-12 02:36:10.308'),(9,'009','Peserta #009',NULL,1,NULL,'2026-11-12 02:36:10.309','2026-11-12 02:36:10.309'),(10,'010','Peserta #010',NULL,1,NULL,'2026-11-12 02:36:10.311','2026-11-12 02:36:10.311'),(11,'011','Peserta #011',NULL,1,NULL,'2026-11-12 02:36:10.312','2026-11-12 02:36:10.312'),(12,'012','Peserta #012',NULL,1,NULL,'2026-11-12 02:36:10.314','2026-11-12 02:36:10.314'),(13,'013','Peserta #013',NULL,1,NULL,'2026-11-12 02:36:10.315','2026-11-12 02:36:10.315'),(14,'014','Peserta #014',NULL,1,NULL,'2026-11-12 02:36:10.317','2026-11-12 02:36:10.317'),(15,'015','Peserta #015',NULL,1,NULL,'2026-11-12 02:36:10.319','2026-11-12 02:36:10.319'),(16,'016','Peserta #016',NULL,1,NULL,'2026-11-12 02:36:10.321','2026-11-12 02:36:10.321'),(17,'017','Peserta #017',NULL,1,NULL,'2026-11-12 02:36:10.326','2026-11-12 02:36:10.326'),(18,'018','Peserta #018',NULL,1,NULL,'2026-11-12 02:36:10.329','2026-11-12 02:36:10.329'),(19,'019','Peserta #019',NULL,1,NULL,'2026-11-12 02:36:10.331','2026-11-12 02:36:10.331'),(20,'020','Peserta #020',NULL,1,NULL,'2026-11-12 02:36:10.334','2026-11-12 02:36:10.334'),(21,'021','Peserta #021',NULL,1,NULL,'2026-11-12 02:36:10.337','2026-11-12 02:36:10.337'),(22,'022','Peserta #022',NULL,1,NULL,'2026-11-12 02:36:10.339','2026-11-12 02:36:10.339'),(23,'023','Peserta #023',NULL,1,NULL,'2026-11-12 02:36:10.341','2026-11-12 02:36:10.341'),(24,'024','Peserta #024',NULL,1,NULL,'2026-11-12 02:36:10.343','2026-11-12 02:36:10.343'),(25,'025','Peserta #025',NULL,1,NULL,'2026-11-12 02:36:10.345','2026-11-12 02:36:10.345'),(26,'026','Peserta #026',NULL,1,NULL,'2026-11-12 02:36:10.346','2026-11-12 02:36:10.346'),(27,'027','Peserta #027',NULL,1,NULL,'2026-11-12 02:36:10.348','2026-11-12 02:36:10.348'),(28,'028','Peserta #028',NULL,1,NULL,'2026-11-12 02:36:10.349','2026-11-12 02:36:10.349'),(29,'029','Peserta #029',NULL,1,NULL,'2026-11-12 02:36:10.351','2026-11-12 02:36:10.351'),(30,'030','Peserta #030',NULL,1,NULL,'2026-11-12 02:36:10.352','2026-11-12 02:36:10.352'),(31,'031','Peserta #031',NULL,1,NULL,'2026-11-12 02:36:10.354','2026-11-12 02:36:10.354'),(32,'032','Peserta #032',NULL,1,NULL,'2026-11-12 02:36:10.356','2026-11-12 02:36:10.356'),(33,'033','Peserta #033',NULL,1,NULL,'2026-11-12 02:36:10.358','2026-11-12 02:36:10.358'),(34,'034','Peserta #034',NULL,1,NULL,'2026-11-12 02:36:10.360','2026-11-12 02:36:10.360'),(35,'035','Peserta #035',NULL,1,NULL,'2026-11-12 02:36:10.363','2026-11-12 02:36:10.363'),(36,'036','Peserta #036',NULL,1,NULL,'2026-11-12 02:36:10.365','2026-11-12 02:36:10.365'),(37,'037','Peserta #037',NULL,1,NULL,'2026-11-12 02:36:10.367','2026-11-12 02:36:10.367'),(38,'038','Peserta #038',NULL,1,NULL,'2026-11-12 02:36:10.370','2026-11-12 02:36:10.370'),(39,'039','Peserta #039',NULL,1,NULL,'2026-11-12 02:36:10.373','2026-11-12 02:36:10.373'),(40,'040','Peserta #040',NULL,1,NULL,'2026-11-12 02:36:10.377','2026-11-12 02:36:10.377'),(41,'041','Peserta #041',NULL,1,NULL,'2026-11-12 02:36:10.379','2026-11-12 02:36:10.379'),(42,'042','Peserta #042',NULL,1,NULL,'2026-11-12 02:36:10.383','2026-11-12 02:36:10.383'),(43,'043','Peserta #043',NULL,1,NULL,'2026-11-12 02:36:10.386','2026-11-12 02:36:10.386'),(44,'044','Peserta #044',NULL,1,NULL,'2026-11-12 02:36:10.389','2026-11-12 02:36:10.389'),(45,'045','Peserta #045',NULL,1,NULL,'2026-11-12 02:36:10.393','2026-11-12 02:36:10.393'),(46,'046','Peserta #046',NULL,1,NULL,'2026-11-12 02:36:10.395','2026-11-12 02:36:10.395'),(47,'047','Peserta #047',NULL,1,NULL,'2026-11-12 02:36:10.398','2026-11-12 02:36:10.398'),(48,'048','Peserta #048',NULL,1,NULL,'2026-11-12 02:36:10.405','2026-11-12 02:36:10.405'),(49,'049','Peserta #049',NULL,1,NULL,'2026-11-12 02:36:10.422','2026-11-12 02:36:10.422'),(50,'050','Peserta #050',NULL,1,NULL,'2026-11-12 02:36:10.444','2026-11-12 02:36:10.444'),(51,'051','Peserta #051',NULL,1,NULL,'2026-11-12 02:36:10.477','2026-11-12 02:36:10.477'),(52,'052','Peserta #052',NULL,1,NULL,'2026-11-12 02:36:10.498','2026-11-12 02:36:10.498'),(53,'053','Peserta #053',NULL,1,NULL,'2026-11-12 02:36:10.511','2026-11-12 02:36:10.511'),(54,'054','Peserta #054',NULL,1,NULL,'2026-11-12 02:36:10.520','2026-11-12 02:36:10.520'),(55,'055','Peserta #055',NULL,1,NULL,'2026-11-12 02:36:10.529','2026-11-12 02:36:10.529'),(56,'056','Peserta #056',NULL,1,NULL,'2026-11-12 02:36:10.539','2026-11-12 02:36:10.539'),(57,'057','Peserta #057',NULL,1,NULL,'2026-11-12 02:36:10.548','2026-11-12 02:36:10.548'),(58,'058','Peserta #058',NULL,1,NULL,'2026-11-12 02:36:10.552','2026-11-12 02:36:10.552'),(59,'059','Peserta #059',NULL,1,NULL,'2026-11-12 02:36:10.556','2026-11-12 02:36:10.556'),(60,'060','Peserta #060',NULL,1,NULL,'2026-11-12 02:36:10.560','2026-11-12 02:36:10.560'),(61,'061','Peserta #061',NULL,1,NULL,'2026-11-12 02:36:10.565','2026-11-12 02:36:10.565'),(62,'062','Peserta #062',NULL,1,NULL,'2026-11-12 02:36:10.570','2026-11-12 02:36:10.570'),(63,'063','Peserta #063',NULL,1,NULL,'2026-11-12 02:36:10.575','2026-11-12 02:36:10.575'),(64,'064','Peserta #064',NULL,1,NULL,'2026-11-12 02:36:10.581','2026-11-12 02:36:10.581'),(65,'065','Peserta #065',NULL,1,NULL,'2026-11-12 02:36:10.584','2026-11-12 02:36:10.584'),(66,'066','Peserta #066',NULL,1,NULL,'2026-11-12 02:36:10.589','2026-11-12 02:36:10.589'),(67,'067','Peserta #067',NULL,1,NULL,'2026-11-12 02:36:10.593','2026-11-12 02:36:10.593'),(68,'068','Peserta #068',NULL,1,NULL,'2026-11-12 02:36:10.596','2026-11-12 02:36:10.596'),(69,'069','Peserta #069',NULL,1,NULL,'2026-11-12 02:36:10.601','2026-11-12 02:36:10.601'),(70,'070','Peserta #070',NULL,1,NULL,'2026-11-12 02:36:10.606','2026-11-12 02:36:10.606'),(71,'071','Peserta #071',NULL,1,NULL,'2026-11-12 02:36:10.622','2026-11-12 02:36:10.622'),(72,'072','Peserta #072',NULL,1,NULL,'2026-11-12 02:36:10.630','2026-11-12 02:36:10.630'),(73,'073','Peserta #073',NULL,1,NULL,'2026-11-12 02:36:10.642','2026-11-12 02:36:10.642'),(74,'074','Peserta #074',NULL,1,NULL,'2026-11-12 02:36:10.647','2026-11-12 02:36:10.647'),(75,'075','Peserta #075',NULL,1,NULL,'2026-11-12 02:36:10.650','2026-11-12 02:36:10.650'),(76,'076','Peserta #076',NULL,1,NULL,'2026-11-12 02:36:10.653','2026-11-12 02:36:10.653'),(77,'077','Peserta #077',NULL,1,NULL,'2026-11-12 02:36:10.655','2026-11-12 02:36:10.655'),(78,'078','Peserta #078',NULL,1,NULL,'2026-11-12 02:36:10.656','2026-11-12 02:36:10.656'),(79,'079','Peserta #079',NULL,1,NULL,'2026-11-12 02:36:10.658','2026-11-12 02:36:10.658'),(80,'080','Peserta #080',NULL,1,NULL,'2026-11-12 02:36:10.660','2026-11-12 02:36:10.660'),(81,'081','Peserta #081',NULL,1,NULL,'2026-11-12 02:36:10.663','2026-11-12 02:36:10.663'),(82,'082','Peserta #082',NULL,1,NULL,'2026-11-12 02:36:10.665','2026-11-12 02:36:10.665'),(83,'083','Peserta #083',NULL,1,NULL,'2026-11-12 02:36:10.668','2026-11-12 02:36:10.668'),(84,'084','Peserta #084',NULL,1,NULL,'2026-11-12 02:36:10.670','2026-11-12 02:36:10.670'),(85,'085','Peserta #085',NULL,1,NULL,'2026-11-12 02:36:10.672','2026-11-12 02:36:10.672'),(86,'086','Peserta #086',NULL,1,NULL,'2026-11-12 02:36:10.674','2026-11-12 02:36:10.674'),(87,'087','Peserta #087',NULL,1,NULL,'2026-11-12 02:36:10.676','2026-11-12 02:36:10.676'),(88,'088','Peserta #088',NULL,1,NULL,'2026-11-12 02:36:10.677','2026-11-12 02:36:10.677'),(89,'089','Peserta #089',NULL,1,NULL,'2026-11-12 02:36:10.679','2026-11-12 02:36:10.679'),(90,'090','Peserta #090',NULL,1,NULL,'2026-11-12 02:36:10.681','2026-11-12 02:36:10.681'),(91,'091','Peserta #091',NULL,1,NULL,'2026-11-12 02:36:10.684','2026-11-12 02:36:10.684'),(92,'092','Peserta #092',NULL,1,NULL,'2026-11-12 02:36:10.688','2026-11-12 02:36:10.688'),(93,'093','Peserta #093',NULL,1,NULL,'2026-11-12 02:36:10.690','2026-11-12 02:36:10.690'),(94,'094','Peserta #094',NULL,1,NULL,'2026-11-12 02:36:10.692','2026-11-12 02:36:10.692'),(95,'095','Peserta #095',NULL,1,NULL,'2026-11-12 02:36:10.694','2026-11-12 02:36:10.694'),(96,'096','Peserta #096',NULL,1,NULL,'2026-11-12 02:36:10.696','2026-11-12 02:36:10.696'),(97,'097','Peserta #097',NULL,1,NULL,'2026-11-12 02:36:10.698','2026-11-12 02:36:10.698'),(98,'098','Peserta #098',NULL,1,NULL,'2026-11-12 02:36:10.699','2026-11-12 02:36:10.699'),(99,'099','Peserta #099',NULL,1,NULL,'2026-11-12 02:36:10.701','2026-11-12 02:36:10.701'),(100,'100','Peserta #100',NULL,1,NULL,'2026-11-12 02:36:10.703','2026-11-12 02:36:10.703'),(101,'101','Peserta #101',NULL,1,NULL,'2026-11-12 02:36:10.705','2026-11-12 02:36:10.705'),(102,'102','Peserta #102',NULL,1,NULL,'2026-11-12 02:36:10.706','2026-11-12 02:36:10.706'),(103,'103','Peserta #103',NULL,1,NULL,'2026-11-12 02:36:10.708','2026-11-12 02:36:10.708'),(104,'104','Peserta #104',NULL,1,NULL,'2026-11-12 02:36:10.710','2026-11-12 02:36:10.710'),(105,'105','Peserta #105',NULL,1,NULL,'2026-11-12 02:36:10.712','2026-11-12 02:36:10.712'),(106,'106','Peserta #106',NULL,1,NULL,'2026-11-12 02:36:10.715','2026-11-12 02:36:10.715'),(107,'107','Peserta #107',NULL,1,NULL,'2026-11-12 02:36:10.719','2026-11-12 02:36:10.719'),(108,'108','Peserta #108',NULL,1,NULL,'2026-11-12 02:36:10.722','2026-11-12 02:36:10.722'),(109,'109','Peserta #109',NULL,1,NULL,'2026-11-12 02:36:10.725','2026-11-12 02:36:10.725'),(110,'110','Peserta #110',NULL,1,NULL,'2026-11-12 02:36:10.728','2026-11-12 02:36:10.728'),(111,'111','Peserta #111',NULL,1,NULL,'2026-11-12 02:36:10.731','2026-11-12 02:36:10.731'),(112,'112','Peserta #112',NULL,1,NULL,'2026-11-12 02:36:10.733','2026-11-12 02:36:10.733'),(113,'113','Peserta #113',NULL,1,NULL,'2026-11-12 02:36:10.735','2026-11-12 02:36:10.735'),(114,'114','Peserta #114',NULL,1,NULL,'2026-11-12 02:36:10.739','2026-11-12 02:36:10.739'),(115,'115','Peserta #115',NULL,1,NULL,'2026-11-12 02:36:10.741','2026-11-12 02:36:10.741'),(116,'116','Peserta #116',NULL,1,NULL,'2026-11-12 02:36:10.742','2026-11-12 02:36:10.742'),(117,'117','Peserta #117',NULL,1,NULL,'2026-11-12 02:36:10.745','2026-11-12 02:36:10.745'),(118,'118','Peserta #118',NULL,1,NULL,'2026-11-12 02:36:10.748','2026-11-12 02:36:10.748'),(119,'119','Peserta #119',NULL,1,NULL,'2026-11-12 02:36:10.752','2026-11-12 02:36:10.752'),(120,'120','Peserta #120',NULL,1,NULL,'2026-11-12 02:36:10.756','2026-11-12 02:36:10.756'),(121,'121','Peserta #121',NULL,1,NULL,'2026-11-12 02:36:10.758','2026-11-12 02:36:10.758'),(122,'122','Peserta #122',NULL,1,NULL,'2026-11-12 02:36:10.761','2026-11-12 02:36:10.761'),(123,'123','Peserta #123',NULL,1,NULL,'2026-11-12 02:36:10.763','2026-11-12 02:36:10.763'),(124,'124','Peserta #124',NULL,1,NULL,'2026-11-12 02:36:10.765','2026-11-12 02:36:10.765'),(125,'125','Peserta #125',NULL,1,NULL,'2026-11-12 02:36:10.766','2026-11-12 02:36:10.766'),(126,'126','Peserta #126',NULL,1,NULL,'2026-11-12 02:36:10.769','2026-11-12 02:36:10.769'),(127,'127','Peserta #127',NULL,1,NULL,'2026-11-12 02:36:10.771','2026-11-12 02:36:10.771'),(128,'128','Peserta #128',NULL,1,NULL,'2026-11-12 02:36:10.773','2026-11-12 02:36:10.773'),(129,'129','Peserta #129',NULL,1,NULL,'2026-11-12 02:36:10.775','2026-11-12 02:36:10.775'),(130,'130','Peserta #130',NULL,1,NULL,'2026-11-12 02:36:10.778','2026-11-12 02:36:10.778'),(131,'131','Peserta #131',NULL,1,NULL,'2026-11-12 02:36:10.782','2026-11-12 02:36:10.782'),(132,'132','Peserta #132',NULL,1,NULL,'2026-11-12 02:36:10.784','2026-11-12 02:36:10.784'),(133,'133','Peserta #133',NULL,1,NULL,'2026-11-12 02:36:10.788','2026-11-12 02:36:10.788'),(134,'134','Peserta #134',NULL,1,NULL,'2026-11-12 02:36:10.791','2026-11-12 02:36:10.791'),(135,'135','Peserta #135',NULL,1,NULL,'2026-11-12 02:36:10.797','2026-11-12 02:36:10.797'),(136,'136','Peserta #136',NULL,1,NULL,'2026-11-12 02:36:10.800','2026-11-12 02:36:10.800'),(137,'137','Peserta #137',NULL,1,NULL,'2026-11-12 02:36:10.803','2026-11-12 02:36:10.803'),(138,'138','Peserta #138',NULL,1,NULL,'2026-11-12 02:36:10.806','2026-11-12 02:36:10.806'),(139,'139','Peserta #139',NULL,1,NULL,'2026-11-12 02:36:10.807','2026-11-12 02:36:10.807'),(140,'140','Peserta #140',NULL,1,NULL,'2026-11-12 02:36:10.809','2026-11-12 02:36:10.809'),(141,'141','Peserta #141',NULL,1,NULL,'2026-11-12 02:36:10.810','2026-11-12 02:36:10.810'),(142,'142','Peserta #142',NULL,1,NULL,'2026-11-12 02:36:10.812','2026-11-12 02:36:10.812'),(143,'143','Peserta #143',NULL,1,NULL,'2026-11-12 02:36:10.814','2026-11-12 02:36:10.814'),(144,'144','Peserta #144',NULL,1,NULL,'2026-11-12 02:36:10.816','2026-11-12 02:36:10.816'),(145,'145','Peserta #145',NULL,1,NULL,'2026-11-12 02:36:10.817','2026-11-12 02:36:10.817'),(146,'146','Peserta #146',NULL,1,NULL,'2026-11-12 02:36:10.819','2026-11-12 02:36:10.819'),(147,'147','Peserta #147',NULL,1,NULL,'2026-11-12 02:36:10.822','2026-11-12 02:36:10.822'),(148,'148','Peserta #148',NULL,1,NULL,'2026-11-12 02:36:10.825','2026-11-12 02:36:10.825'),(149,'149','Peserta #149',NULL,1,NULL,'2026-11-12 02:36:10.826','2026-11-12 02:36:10.826'),(150,'150','Peserta #150',NULL,1,NULL,'2026-11-12 02:36:10.828','2026-11-12 02:36:10.828'),(151,'151','Peserta #151',NULL,1,NULL,'2026-11-12 02:36:10.830','2026-11-12 02:36:10.830'),(152,'152','Peserta #152',NULL,1,NULL,'2026-11-12 02:36:10.832','2026-11-12 02:36:10.832'),(153,'153','Peserta #153',NULL,1,NULL,'2026-11-12 02:36:10.834','2026-11-12 02:36:10.834'),(154,'154','Peserta #154',NULL,1,NULL,'2026-11-12 02:36:10.836','2026-11-12 02:36:10.836'),(155,'155','Peserta #155',NULL,1,NULL,'2026-11-12 02:36:10.839','2026-11-12 02:36:10.839'),(156,'156','Peserta #156',NULL,1,NULL,'2026-11-12 02:36:10.842','2026-11-12 02:36:10.842'),(157,'157','Peserta #157',NULL,1,NULL,'2026-11-12 02:36:10.844','2026-11-12 02:36:10.844'),(158,'158','Peserta #158',NULL,1,NULL,'2026-11-12 02:36:10.846','2026-11-12 02:36:10.846'),(159,'159','Peserta #159',NULL,1,NULL,'2026-11-12 02:36:10.848','2026-11-12 02:36:10.848'),(160,'160','Peserta #160',NULL,1,NULL,'2026-11-12 02:36:10.850','2026-11-12 02:36:10.850'),(161,'161','Peserta #161',NULL,1,NULL,'2026-11-12 02:36:10.852','2026-11-12 02:36:10.852'),(162,'162','Peserta #162',NULL,1,NULL,'2026-11-12 02:36:10.855','2026-11-12 02:36:10.855'),(163,'163','Peserta #163',NULL,1,NULL,'2026-11-12 02:36:10.857','2026-11-12 02:36:10.857'),(164,'164','Peserta #164',NULL,1,NULL,'2026-11-12 02:36:10.858','2026-11-12 02:36:10.858'),(165,'165','Peserta #165',NULL,1,NULL,'2026-11-12 02:36:10.860','2026-11-12 02:36:10.860'),(166,'166','Peserta #166',NULL,1,NULL,'2026-11-12 02:36:10.862','2026-11-12 02:36:10.862'),(167,'167','Peserta #167',NULL,1,NULL,'2026-11-12 02:36:10.864','2026-11-12 02:36:10.864'),(168,'168','Peserta #168',NULL,1,NULL,'2026-11-12 02:36:10.865','2026-11-12 02:36:10.865'),(169,'169','Peserta #169',NULL,1,NULL,'2026-11-12 02:36:10.867','2026-11-12 02:36:10.867'),(170,'170','Peserta #170',NULL,1,NULL,'2026-11-12 02:36:10.870','2026-11-12 02:36:10.870'),(171,'171','Peserta #171',NULL,1,NULL,'2026-11-12 02:36:10.872','2026-11-12 02:36:10.872'),(172,'172','Peserta #172',NULL,1,NULL,'2026-11-12 02:36:10.874','2026-11-12 02:36:10.874'),(173,'173','Peserta #173',NULL,1,NULL,'2026-11-12 02:36:10.876','2026-11-12 02:36:10.876'),(174,'174','Peserta #174',NULL,1,NULL,'2026-11-12 02:36:10.877','2026-11-12 02:36:10.877'),(175,'175','Peserta #175',NULL,1,NULL,'2026-11-12 02:36:10.879','2026-11-12 02:36:10.879'),(176,'176','Peserta #176',NULL,1,NULL,'2026-11-12 02:36:10.881','2026-11-12 02:36:10.881'),(177,'177','Peserta #177',NULL,1,NULL,'2026-11-12 02:36:10.882','2026-11-12 02:36:10.882'),(178,'178','Peserta #178',NULL,1,NULL,'2026-11-12 02:36:10.884','2026-11-12 02:36:10.884'),(179,'179','Peserta #179',NULL,1,NULL,'2026-11-12 02:36:10.886','2026-11-12 02:36:10.886'),(180,'180','Peserta #180',NULL,1,NULL,'2026-11-12 02:36:10.888','2026-11-12 02:36:10.888'),(181,'181','Peserta #181',NULL,1,NULL,'2026-11-12 02:36:10.890','2026-11-12 02:36:10.890'),(182,'182','Peserta #182',NULL,1,NULL,'2026-11-12 02:36:10.891','2026-11-12 02:36:10.891'),(183,'183','Peserta #183',NULL,1,NULL,'2026-11-12 02:36:10.893','2026-11-12 02:36:10.893'),(184,'184','Peserta #184',NULL,1,NULL,'2026-11-12 02:36:10.897','2026-11-12 02:36:10.897'),(185,'185','Peserta #185',NULL,1,NULL,'2026-11-12 02:36:10.899','2026-11-12 02:36:10.899'),(186,'186','Peserta #186',NULL,1,NULL,'2026-11-12 02:36:10.902','2026-11-12 02:36:10.902'),(187,'187','Peserta #187',NULL,1,NULL,'2026-11-12 02:36:10.904','2026-11-12 02:36:10.904'),(188,'188','Peserta #188',NULL,1,NULL,'2026-11-12 02:36:10.906','2026-11-12 02:36:10.906'),(189,'189','Peserta #189',NULL,1,NULL,'2026-11-12 02:36:10.907','2026-11-12 02:36:10.907'),(190,'190','Peserta #190',NULL,1,NULL,'2026-11-12 02:36:10.908','2026-11-12 02:36:10.908'),(191,'191','Peserta #191',NULL,1,NULL,'2026-11-12 02:36:10.910','2026-11-12 02:36:10.910'),(192,'192','Peserta #192',NULL,1,NULL,'2026-11-12 02:36:10.914','2026-11-12 02:36:10.914'),(193,'193','Peserta #193',NULL,1,NULL,'2026-11-12 02:36:10.915','2026-11-12 02:36:10.915'),(194,'194','Peserta #194',NULL,1,NULL,'2026-11-12 02:36:10.916','2026-11-12 02:36:10.916'),(195,'195','Peserta #195',NULL,1,NULL,'2026-11-12 02:36:10.918','2026-11-12 02:36:10.918'),(196,'196','Peserta #196',NULL,1,NULL,'2026-11-12 02:36:10.921','2026-11-12 02:36:10.921'),(197,'197','Peserta #197',NULL,1,NULL,'2026-11-12 02:36:10.923','2026-11-12 02:36:10.923'),(198,'198','Peserta #198',NULL,1,NULL,'2026-11-12 02:36:10.924','2026-11-12 02:36:10.924'),(199,'199','Peserta #199',NULL,1,NULL,'2026-11-12 02:36:10.926','2026-11-12 02:36:10.926'),(200,'200','Peserta #200',NULL,1,NULL,'2026-11-12 02:36:10.928','2026-11-12 02:36:10.928'),(201,'201','Peserta #201',NULL,1,NULL,'2026-11-12 02:36:10.930','2026-11-12 02:36:10.930'),(202,'202','Peserta #202',NULL,1,NULL,'2026-11-12 02:36:10.932','2026-11-12 02:36:10.932'),(203,'203','Peserta #203',NULL,1,NULL,'2026-11-12 02:36:10.933','2026-11-12 02:36:10.933'),(204,'204','Peserta #204',NULL,1,NULL,'2026-11-12 02:36:10.939','2026-11-12 02:36:10.939'),(205,'205','Peserta #205',NULL,1,NULL,'2026-11-12 02:36:10.941','2026-11-12 02:36:10.941'),(206,'206','Peserta #206',NULL,1,NULL,'2026-11-12 02:36:10.944','2026-11-12 02:36:10.944'),(207,'207','Peserta #207',NULL,1,NULL,'2026-11-12 02:36:10.947','2026-11-12 02:36:10.947'),(208,'208','Peserta #208',NULL,1,NULL,'2026-11-12 02:36:10.950','2026-11-12 02:36:10.950'),(209,'209','Peserta #209',NULL,1,NULL,'2026-11-12 02:36:10.954','2026-11-12 02:36:10.954'),(210,'210','Peserta #210',NULL,1,NULL,'2026-11-12 02:36:10.956','2026-11-12 02:36:10.956'),(211,'211','Peserta #211',NULL,1,NULL,'2026-11-12 02:36:10.958','2026-11-12 02:36:10.958'),(212,'212','Peserta #212',NULL,1,NULL,'2026-11-12 02:36:10.960','2026-11-12 02:36:10.960'),(213,'213','Peserta #213',NULL,1,NULL,'2026-11-12 02:36:10.962','2026-11-12 02:36:10.962'),(214,'214','Peserta #214',NULL,1,NULL,'2026-11-12 02:36:10.964','2026-11-12 02:36:10.964'),(215,'215','Peserta #215',NULL,1,NULL,'2026-11-12 02:36:10.966','2026-11-12 02:36:10.966'),(216,'216','Peserta #216',NULL,1,NULL,'2026-11-12 02:36:10.967','2026-11-12 02:36:10.967'),(217,'217','Peserta #217',NULL,1,NULL,'2026-11-12 02:36:10.969','2026-11-12 02:36:10.969'),(218,'218','Peserta #218',NULL,1,NULL,'2026-11-12 02:36:10.971','2026-11-12 02:36:10.971'),(219,'219','Peserta #219',NULL,1,NULL,'2026-11-12 02:36:10.974','2026-11-12 02:36:10.974'),(220,'220','Peserta #220',NULL,1,NULL,'2026-11-12 02:36:10.976','2026-11-12 02:36:10.976'),(221,'221','Peserta #221',NULL,1,NULL,'2026-11-12 02:36:10.979','2026-11-12 02:36:10.979'),(222,'222','Peserta #222',NULL,1,NULL,'2026-11-12 02:36:10.982','2026-11-12 02:36:10.982'),(223,'223','Peserta #223',NULL,1,NULL,'2026-11-12 02:36:10.985','2026-11-12 02:36:10.985'),(224,'224','Peserta #224',NULL,1,NULL,'2026-11-12 02:36:10.989','2026-11-12 02:36:10.989'),(225,'225','Peserta #225',NULL,1,NULL,'2026-11-12 02:36:11.007','2026-11-12 02:36:11.007'),(226,'226','Peserta #226',NULL,1,NULL,'2026-11-12 02:36:11.015','2026-11-12 02:36:11.015'),(227,'227','Peserta #227',NULL,1,NULL,'2026-11-12 02:36:11.039','2026-11-12 02:36:11.039'),(228,'228','Peserta #228',NULL,1,NULL,'2026-11-12 02:36:11.057','2026-11-12 02:36:11.057'),(229,'229','Peserta #229',NULL,1,NULL,'2026-11-12 02:36:11.067','2026-11-12 02:36:11.067'),(230,'230','Peserta #230',NULL,1,NULL,'2026-11-12 02:36:11.073','2026-11-12 02:36:11.073'),(231,'231','Peserta #231',NULL,1,NULL,'2026-11-12 02:36:11.075','2026-11-12 02:36:11.075'),(232,'232','Peserta #232',NULL,1,NULL,'2026-11-12 02:36:11.079','2026-11-12 02:36:11.079'),(233,'233','Peserta #233',NULL,1,NULL,'2026-11-12 02:36:11.081','2026-11-12 02:36:11.081'),(234,'234','Peserta #234',NULL,1,NULL,'2026-11-12 02:36:11.083','2026-11-12 02:36:11.083'),(235,'235','Peserta #235',NULL,1,NULL,'2026-11-12 02:36:11.086','2026-11-12 02:36:11.086'),(236,'236','Peserta #236',NULL,1,NULL,'2026-11-12 02:36:11.089','2026-11-12 02:36:11.089'),(237,'237','Peserta #237',NULL,1,NULL,'2026-11-12 02:36:11.092','2026-11-12 02:36:11.092'),(238,'238','Peserta #238',NULL,1,NULL,'2026-11-12 02:36:11.094','2026-11-12 02:36:11.094'),(239,'239','Peserta #239',NULL,1,NULL,'2026-11-12 02:36:11.097','2026-11-12 02:36:11.097'),(240,'240','Peserta #240',NULL,1,NULL,'2026-11-12 02:36:11.100','2026-11-12 02:36:11.100'),(241,'241','Peserta #241',NULL,1,NULL,'2026-11-12 02:36:11.103','2026-11-12 02:36:11.103'),(242,'242','Peserta #242',NULL,1,NULL,'2026-11-12 02:36:11.107','2026-11-12 02:36:11.107'),(243,'243','Peserta #243',NULL,1,NULL,'2026-11-12 02:36:11.109','2026-11-12 02:36:11.109'),(244,'244','Peserta #244',NULL,1,NULL,'2026-11-12 02:36:11.113','2026-11-12 02:36:11.113'),(245,'245','Peserta #245',NULL,1,NULL,'2026-11-12 02:36:11.117','2026-11-12 02:36:11.117'),(246,'246','Peserta #246',NULL,1,NULL,'2026-11-12 02:36:11.121','2026-11-12 02:36:11.121'),(247,'247','Peserta #247',NULL,1,NULL,'2026-11-12 02:36:11.123','2026-11-12 02:36:11.123'),(248,'248','Peserta #248',NULL,1,NULL,'2026-11-12 02:36:11.124','2026-11-12 02:36:11.124'),(249,'249','Peserta #249',NULL,1,NULL,'2026-11-12 02:36:11.127','2026-11-12 02:36:11.127'),(250,'250','Peserta #250',NULL,1,NULL,'2026-11-12 02:36:11.131','2026-11-12 02:36:11.131');
/*!40000 ALTER TABLE `peserta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_idx` (`user_id`),
  KEY `sessions_expires_at_idx` (`expires_at`),
  CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','JURI') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `failed_logins` int NOT NULL DEFAULT '0',
  `locked_until` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$argon2id$v=19$m=19456,t=2,p=1$/lcSHCyOBERKNV3HkGjQTQ$fAgw35uH5LWrlHjFz8l0oE4f/9qBV/v7l0i//WzxBKY','ADMIN',1,1,0,NULL,'2026-11-12 02:36:10.246','2026-11-12 02:36:10.246'),(2,'j01','$argon2id$v=19$m=19456,t=2,p=1$ouzSCOQUcpTilc9l5cgB1Q$k0h+ViMj+oy4JbMfTE6S7UXTudF6PKeQiAHagyQ8+6o','JURI',1,0,0,NULL,'2026-11-12 02:36:10.265','2026-11-12 02:36:10.265'),(3,'j02','$argon2id$v=19$m=19456,t=2,p=1$ouzSCOQUcpTilc9l5cgB1Q$k0h+ViMj+oy4JbMfTE6S7UXTudF6PKeQiAHagyQ8+6o','JURI',1,0,0,NULL,'2026-11-12 02:36:10.268','2026-11-12 02:36:10.268'),(4,'j03','$argon2id$v=19$m=19456,t=2,p=1$ouzSCOQUcpTilc9l5cgB1Q$k0h+ViMj+oy4JbMfTE6S7UXTudF6PKeQiAHagyQ8+6o','JURI',1,0,0,NULL,'2026-11-12 02:36:10.270','2026-11-12 02:36:10.270');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-12  9:37:11
