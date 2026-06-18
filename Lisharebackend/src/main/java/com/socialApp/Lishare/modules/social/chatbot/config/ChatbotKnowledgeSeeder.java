package com.socialApp.Lishare.modules.social.chatbot.config;

import com.socialApp.Lishare.modules.social.chatbot.entity.Concept;
import com.socialApp.Lishare.modules.social.chatbot.repository.ConceptRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChatbotKnowledgeSeeder implements ApplicationRunner {

    private final ConceptRepository conceptRepository;

    public ChatbotKnowledgeSeeder(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (SeedConcept seed : seedConcepts()) {
            Concept concept = conceptRepository.findByTopicIgnoreCase(seed.topic())
                    .orElseGet(Concept::new);
            concept.setTopic(seed.topic());
            concept.setKeywords(seed.keywords());
            concept.setDescription(seed.description());
            conceptRepository.save(concept);
        }
    }

    private List<SeedConcept> seedConcepts() {
        return List.of(
                new SeedConcept(
                        "AgroLink Hub",
                        "about agrolink, what is agrolink, platform, social marketplace, agriculture community",
                        "AgroLink Hub is a social marketplace for agriculture and small business. Members can post updates, share stories, chat, buy products, sell products, manage orders, plan tasks, review sellers, and contact support from one platform."
                ),
                new SeedConcept(
                        "Signup",
                        "create account, register, join, new account, sign up, account details",
                        "To create an account, open Create account, enter your basic details, choose your role, finish the profile steps, then verify the OTP sent to your email."
                ),
                new SeedConcept(
                        "Login",
                        "sign in, signin, login issue, password, google login, access account",
                        "Use Login with your email and password, or continue with Google if your account supports it. If your password is wrong or forgotten, use the Forgot password flow."
                ),
                new SeedConcept(
                        "Forgot password",
                        "reset password, forgot password, otp recovery, recover account, change password",
                        "Forgot password asks for at least two identifiers, sends an OTP, verifies the code, and lets you set a new password for your AgroLink Hub account."
                ),
                new SeedConcept(
                        "Verify OTP",
                        "otp, verify account, verification code, email code, resend code",
                        "After signup, enter the 6-digit OTP code on the Verify page. If the code expires or does not arrive, use Resend code and then verify again."
                ),
                new SeedConcept(
                        "Social feed",
                        "feed, posts, create post, comments, reactions, likes, saves, shares, media, reels",
                        "The social feed is where members publish posts, media, reels, comments, reactions, saves, shares, and reports. It keeps the community active between buying and selling."
                ),
                new SeedConcept(
                        "Stories",
                        "story, stories, temporary post, share story, react story, view story",
                        "Stories are short updates members can publish for quick visibility. Other members can view, react, reply, and share stories depending on the available controls."
                ),
                new SeedConcept(
                        "Marketplace",
                        "marketplace, products, browse products, buy products, product search, local products",
                        "Marketplace lets buyers browse local products, view product details, save items, add items to the cart, and place orders with sellers."
                ),
                new SeedConcept(
                        "Selling products",
                        "sell, seller, farmer seller, business seller, add product, publish product, business page",
                        "Business and farmer accounts can create or manage a business page, publish products, update product details, follow orders, and use analytics to understand activity."
                ),
                new SeedConcept(
                        "Cart",
                        "cart, add to cart, checkout, saved product, bookmark product",
                        "Use the cart to keep products you want to buy, update quantities, and move selected items into checkout when you are ready to order."
                ),
                new SeedConcept(
                        "Orders",
                        "order, purchase, pending, completed, cancel order, order tracking, buyer seller update",
                        "Orders keep buyer and seller activity in one place. You can place orders, review order status, cancel where allowed, and follow seller updates."
                ),
                new SeedConcept(
                        "Reviews",
                        "review, rating, website review, seller review, product review, feedback",
                        "Reviews help members share feedback. Website reviews can appear publicly on the landing page, and business-related reviews help buyers understand sellers."
                ),
                new SeedConcept(
                        "Support",
                        "support, help, ticket, problem, report issue, contact admin, admin reply",
                        "Support is for asking for help, reporting problems, reading admin replies, and keeping platform issues organized."
                ),
                new SeedConcept(
                        "Calendar",
                        "calendar, event, reminder, planning, farm task, meeting, birthday",
                        "Calendar helps members plan farm tasks, events, meetings, birthdays, and reminders without leaving the AgroLink workspace."
                ),
                new SeedConcept(
                        "Chat",
                        "chat, messages, direct message, group message, attachment, conversation",
                        "Chat lets members talk through direct or group conversations, send messages, and keep buyer, seller, and community communication close to the feed."
                ),
                new SeedConcept(
                        "Notifications",
                        "notification, alerts, unread, updates, activity",
                        "Notifications show recent activity such as messages, reactions, comments, support updates, and other platform events that need attention."
                ),
                new SeedConcept(
                        "Friends and followers",
                        "friends, followers, following, connect users, search people, friend request",
                        "Members can search for people, follow users, send friend requests, accept requests, and build a community around their social and business activity."
                ),
                new SeedConcept(
                        "Admin safety",
                        "admin, moderation, reports, user review, safety, clean platform",
                        "Admins can review users, reports, moderation tasks, support questions, and safety workflows to help keep the platform clean."
                ),
                new SeedConcept(
                        "Analytics",
                        "analytics, insights, seller dashboard, performance, stats",
                        "Analytics helps business and farmer accounts understand product, order, page, and marketplace activity so they can make better decisions."
                ),
                new SeedConcept(
                        "Roles",
                        "role, user, business, farmer, creator, admin, account type",
                        "AgroLink Hub supports different roles such as user, business seller, farmer seller, creator, and admin. The role controls which tools are available after login."
                ),
                new SeedConcept(
                        "Privacy and security",
                        "privacy, security, protected account, data, safe, password",
                        "AgroLink Hub uses authentication, OTP verification, protected routes, and role-based access to keep account activity and platform tools safer."
                )
        );
    }

    private record SeedConcept(String topic, String keywords, String description) {}
}
