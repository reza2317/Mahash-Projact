<?php
if ( ! function_exists( 'mahash_setup' ) ) :
	function mahash_setup() {
		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		register_nav_menus( array(
			'menu-1' => esc_html__( 'Primary Menu', 'mahash-theme' ),
		) );
	}
endif;
add_action( 'after_setup_theme', 'mahash_setup' );

function mahash_scripts() {
    wp_enqueue_script( 'tailwindcss', 'https://cdn.tailwindcss.com', array(), '3.4.1', false );
    wp_enqueue_style( 'vazirmatn', 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.0.0/Vazirmatn-font-face.css', array(), '33.0.0' );
    wp_add_inline_script('tailwindcss', '
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    fontFamily: {
                        sans: ["Vazirmatn", "sans-serif"],
                    }
                }
            }
        }
    ');
}
add_action( 'wp_enqueue_scripts', 'mahash_scripts' );

function mahash_mime_types($mimes) {
  $mimes['svg'] = 'image/svg+xml';
  return $mimes;
}
add_filter('upload_mimes', 'mahash_mime_types');
