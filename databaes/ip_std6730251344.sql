-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 15, 2026 at 03:39 PM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730251344`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `address_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `product_id`, `quantity`) VALUES
(1, 2, 8, 3),
(2, 2, 9, 1),
(8, 7, 20, 1),
(9, 7, 19, 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` int DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` int DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_count` int DEFAULT '1',
  `location_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `badge_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `image` text COLLATE utf8mb4_unicode_ci,
  `serial_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vram` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `selling_price` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `stock`, `category`, `price`, `status`, `stock_text`, `location_count`, `location_text`, `badge_status`, `image_url`, `image`, `serial_number`, `brand`, `vram`, `cost_price`, `selling_price`) VALUES
(13, 'GALAX RTX 3060 (1-Click OC) LHR 12GB GDDR6 192-bit', 11, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'https://media-cdn.bnn.in.th/105990/galax-rtx-3060-1-click-oc-12gb-gddr6-192-bit-1.jpg', NULL, 'GALAX', '12', 15800.00, 15800.00),
(14, 'PNY RTX 3090 24GB XLR8 Gaming REVEL EPIC-X RGB 24GB GDDR6X 384-bit', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'https://media-cdn.bnn.in.th/119859/pny-rtx3090-24gb-xlr8-gaming-revel-epic-x-rgb-triple-fan-1.jpg', NULL, 'PNY', '24G', 72900.00, 72900.00),
(19, 'VGA(การ์ดจอ) POWERCOLOR RADEON RX 7600 FIGHTER 8G V2 - 8GB GDDR6 (RX 7600 8G-F/V2) (3Y)', 100, 'GPU', NULL, NULL, NULL, 1, NULL, NULL, NULL, 'https://ihcupload-bkk.s3.ap-southeast-7.amazonaws.com/img/product/products103790_800.jpg', NULL, 'POWERCOLOR RADEON', '8', 8990.00, 8990.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `avatar_url`) VALUES
(2, 'bike123', '123456', 'user', 'https://ihcupload-bkk.s3.ap-southeast-7.amazonaws.com/img/product/products95118_800.jpg'),
(3, 'lnwza', '1234', 'admin', NULL),
(4, 'warit', '123456', 'admin', 'https://i.pinimg.com/736x/ed/06/38/ed0638687dc1e0d83c6aec81d218ff42.jpg'),
(7, 'nindam1', '123456', 'user', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
