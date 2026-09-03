<!DOCTYPE html>
<html <?php language_attributes(); ?> dir="rtl" class="dark">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
    <style>
        body { font-family: "Vazirmatn", sans-serif; }
    </style>
</head>
<body <?php body_class('bg-[#0f1218] text-slate-200 min-h-screen flex flex-col'); ?>>
<?php wp_body_open(); ?>
<header class="bg-[#191e23] border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center gap-3">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="text-xl font-black text-white hover:text-blue-400 transition">
                    <?php bloginfo( 'name' ); ?>
                </a>
            </div>
            <nav class="hidden md:flex gap-6 text-sm font-medium">
                <?php
                wp_nav_menu( array(
                    'theme_location' => 'menu-1',
                    'menu_class'     => 'flex gap-6 text-slate-300',
                    'fallback_cb'    => false,
                ) );
                ?>
            </nav>
        </div>
    </div>
</header>
<main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
