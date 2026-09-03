import JSZip from 'jszip';

export const generateWpThemeZip = async () => {
  const zip = new JSZip();

  // Create a folder for the theme
  const theme = zip.folder("mahash-wp-theme");
  if (!theme) return;

  // 1. style.css
  theme.file("style.css", `/*
Theme Name: Mahash WordPress Theme
Theme URI: https://yourwebsite.com/
Author: Mahash Admin
Author URI: https://yourwebsite.com/
Description: پوسته اختصاصی و بهینه‌شده سایت با طراحی مدرن و تیره (Dark Mode) مبتنی بر Tailwind CSS
Version: 1.0.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: mahash-theme
*/

/* 
 * تمامی استایل‌ها از طریق Tailwind CSS بارگذاری می‌شوند.
 * این فایل صرفاً جهت معرفی پوسته به وردپرس است. 
 */
`);

  // 2. functions.php
  theme.file("functions.php", `<?php
/**
 * Mahash Theme functions and definitions
 */

if ( ! function_exists( 'mahash_setup' ) ) :
	function mahash_setup() {
		// Add default posts and comments RSS feed links to head.
		add_theme_support( 'automatic-feed-links' );

		// Let WordPress manage the document title.
		add_theme_support( 'title-tag' );

		// Enable support for Post Thumbnails on posts and pages.
		add_theme_support( 'post-thumbnails' );

		// Register menus
		register_nav_menus( array(
			'menu-1' => esc_html__( 'Primary Menu', 'mahash-theme' ),
		) );
	}
endif;
add_action( 'after_setup_theme', 'mahash_setup' );

/**
 * Enqueue scripts and styles.
 */
function mahash_scripts() {
    // Load Tailwind CSS via CDN for rapid development (In production, compile this locally)
    wp_enqueue_script( 'tailwindcss', 'https://cdn.tailwindcss.com', array(), '3.4.1', false );
    
    // Add Vazirmatn Font
    wp_enqueue_style( 'vazirmatn', 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.0.0/Vazirmatn-font-face.css', array(), '33.0.0' );

    // Custom configuration for Tailwind
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

// Add custom SVG upload support
function mahash_mime_types($mimes) {
  $mimes['svg'] = 'image/svg+xml';
  return $mimes;
}
add_filter('upload_mimes', 'mahash_mime_types');
`);

  // 3. header.php
  theme.file("header.php", `<!DOCTYPE html>
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
`);

  // 4. footer.php
  theme.file("footer.php", `</main> <!-- End Main -->

<footer class="bg-[#191e23] border-t border-slate-800 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-sm text-slate-400">
            &copy; <?php echo date('Y'); ?> <?php bloginfo( 'name' ); ?>. تمامی حقوق محفوظ است.
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
`);

  // 5. index.php (The Loop)
  theme.file("index.php", `<?php get_header(); ?>

<div class="space-y-8">
    <header class="mb-8">
        <h1 class="text-3xl font-black text-white">آخرین گزارش‌ها و مقالات</h1>
        <p class="text-slate-400 mt-2">تازه‌ترین محتوای منتشر شده در سایت</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <?php
    if ( have_posts() ) :
        while ( have_posts() ) :
            the_post();
            ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('bg-[#23282d] border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 transition shadow-lg flex flex-col'); ?>>
                <?php if ( has_post_thumbnail() ) : ?>
                    <a href="<?php the_permalink(); ?>" class="aspect-video block bg-black overflow-hidden">
                        <?php the_post_thumbnail('large', array('class' => 'w-full h-full object-cover hover:scale-105 transition duration-500')); ?>
                    </a>
                <?php else: ?>
                    <div class="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <svg class="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                <?php endif; ?>
                
                <div class="p-6 flex flex-col flex-grow">
                    <header class="mb-4">
                        <div class="text-[10px] text-blue-400 font-mono mb-2"><?php echo get_the_date(); ?></div>
                        <h2 class="text-xl font-bold text-white mb-2">
                            <a href="<?php the_permalink(); ?>" class="hover:text-blue-400 transition">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                    </header>
                    <div class="text-sm text-slate-300 line-clamp-3 mb-6">
                        <?php the_excerpt(); ?>
                    </div>
                    <div class="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center">
                        <div class="text-xs text-slate-400">نویسنده: <?php the_author(); ?></div>
                        <a href="<?php the_permalink(); ?>" class="text-blue-400 hover:text-blue-300 text-xs font-bold">ادامه مطلب &larr;</a>
                    </div>
                </div>
            </article>
            <?php
        endwhile;
        
        the_posts_navigation(array(
            'prev_text' => 'نوشته‌های قدیمی‌تر',
            'next_text' => 'نوشته‌های جدیدتر',
            'class' => 'mt-8 flex justify-between text-blue-400'
        ));
    else :
        ?>
        <p class="text-slate-400">هیچ نوشته‌ای یافت نشد.</p>
        <?php
    endif;
    ?>
    </div>
</div>

<?php get_footer(); ?>
`);

  // 6. single.php (Single Post)
  theme.file("single.php", `<?php get_header(); ?>

<?php
while ( have_posts() ) :
    the_post();
    ?>
    <article id="post-<?php the_ID(); ?>" <?php post_class('max-w-4xl mx-auto bg-[#23282d] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl'); ?>>
        <?php if ( has_post_thumbnail() ) : ?>
            <div class="aspect-video w-full bg-black">
                <?php the_post_thumbnail('full', array('class' => 'w-full h-full object-cover')); ?>
            </div>
        <?php endif; ?>
        
        <div class="p-6 sm:p-10">
            <header class="mb-8 border-b border-slate-700 pb-8">
                <div class="flex items-center gap-4 text-xs text-slate-400 mb-4 font-mono">
                    <span><?php echo get_the_date(); ?></span>
                    <span>•</span>
                    <span><?php the_author(); ?></span>
                </div>
                <h1 class="text-3xl sm:text-4xl font-black text-white leading-tight">
                    <?php the_title(); ?>
                </h1>
            </header>

            <div class="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-400">
                <?php the_content(); ?>
            </div>
            
            <?php
            // Custom field for Video URL integration if mapped from the React app
            $video_url = get_post_meta( get_the_ID(), 'video_url', true );
            if ( ! empty( $video_url ) ) :
            ?>
                <div class="mt-10 pt-8 border-t border-slate-700">
                    <h3 class="text-lg font-bold text-white mb-4">ویدیو پیوست شده:</h3>
                    <div class="aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-700">
                        <video src="<?php echo esc_url($video_url); ?>" controls class="w-full h-full"></video>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </article>
    <?php
endwhile;
?>

<?php get_footer(); ?>
`);

  // Generate the zip Blob
  const content = await zip.generateAsync({ type: "blob" });
  
  // Trigger download
  const url = window.URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mahash-wp-theme.zip";
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
